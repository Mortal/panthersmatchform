/** @jsx React.DOM */
// vim:set ft=javascript sw=2 et:

var SETS = 3;
var SETSCORE = 25;
var FINALSETSCORE = 15;
var SETAHEAD = 2;
var TIMEOUTS = 2;
var SUBSTITUTIONS = 6;
var MAXPLAYERNUMBER = 30;
var FIELDPLAYERS = 6;


function generateNewTeamInSet() {
  return {
    score: 0,
    subs: [],
    timeouts: [null, null],
    lineup: [1,2,3,4,5,6]
  };
}
function generateNewSet() {
  return [
    generateNewTeamInSet(), generateNewTeamInSet()
  ]
}

[{score: 15, subs: [[1, 23]], timeouts: [[15, 10], null],
          lineup: [1, 8, 12, 23, 7, 2]},
        {score: 10, subs: [[23, 12]], timeouts: [null, null],
          lineup: [2, 1, 8, 12, 23, 7]}]

/*
console.log = function () {
  var e = document.getElementById('messages');
  if (e) {
    e.textContent = [].slice.call(arguments) + '';
  }
};

window.onerror = function () {
  console.log.apply(null, arguments);
};
*/

function getSetWinner(setIndex, s1, s2) {
  var needed = (setIndex == 2) ? FINALSETSCORE : SETSCORE;
  if (s1 >= needed && s1 >= s2 + SETAHEAD) return 0;
  else if (s2 >= needed && s2 >= s1 + SETAHEAD) return 1;
  else return -1;
}

///////////////////////////////////////////////////////////////////////////////
// Command pattern classes.
//
// Each class implements `execute` and `undo` which take a reference to the
// MatchForm state and performs or undoes the command.
//
// A Command must implement `description` which returns a React Renderable
// (for instance a string, a React component, or an array of Renderables).
// The description is used in the action list.
//
// A Command may implement `noop` which returns true if the command is a no-op
// (for instance, adding zero score).
//
// A Command may implement `inverts` which takes another Command and returns
// true if the two commands are each others inverse (for instance, one Command
// adding a point, and the other Command removing a point from the same team
// in the same set).
///////////////////////////////////////////////////////////////////////////////

//-----------------------------------------------------------------------------
// Command for starting a set

function StartSet(st, set) {
  this.lastSet = st.currentSetIndex;
  this.nextSet = set;
  if(set >= st.sets.length) {
    this.nextSet = st.sets.length - 1;
  }
}

StartSet.prototype.execute = function(st) {
  st.currentSetIndex = this.nextSet;
}

StartSet.prototype.undo = function(st) {
  st.currentSetIndex = this.lastSet;
}

StartSet.prototype.noop = function() {
  return this.lastSet == this.nextSet;
}

StartSet.prototype.description = function() {
  return "Sæt " +(this.nextSet + 1) + " er startet";
}

//-----------------------------------------------------------------------------
// Command for adding or subtracting score

function AddScore(st, setIndex, teamIndex, points) {
  this.setIndex = setIndex;
  this.teamIndex = teamIndex;
  this.points = points;
  if (st.sets[setIndex].teams[teamIndex].score + this.points < 0) {
    this.points = -st.sets[setIndex].teams[teamIndex].score;
  }
  this.teamName = st.game.teams[teamIndex].name;
  this.teamNames = [st.game.teams[0].name, st.game.teams[1].name];
  var set = st.sets[setIndex];
  this.newScore = [set.teams[0].score, set.teams[1].score];
  this.newScore[teamIndex] += this.points;
}

AddScore.prototype.execute = function (st) {
  var currentSet = st.sets[this.setIndex];
  var currentTeamSet = currentSet.teams[this.teamIndex];
  var newScore = currentTeamSet.score + this.points;
  currentTeamSet.score = newScore;
  if (currentSet.serve != this.teamIndex) {
    currentSet.serve = this.teamIndex;

    var lineup = currentTeamSet.lineup;
    var amount = 1;
    var a = lineup.slice(0, amount);
    var b = lineup.slice(amount);
    lineup = b;
    lineup.push.apply(lineup, a);
    currentTeamSet.lineup = lineup;
  }
};

AddScore.prototype.inverts = function (other) {
  return (other instanceof AddScore
          && this.setIndex == other.setIndex
          && this.teamIndex == other.teamIndex
          && this.points == -other.points);
};

AddScore.prototype.noop = function () {
  return this.points == 0;
};

AddScore.prototype.undo = function (st) {
  var newScore = st.sets[this.setIndex].teams[this.teamIndex].score - this.points;
  st.sets[this.setIndex].teams[this.teamIndex].score = newScore;
};

AddScore.prototype.description = function () {
  if (this.points == 1) {
    var balls = ['', ''];
    balls[this.teamIndex] = <img src="ball.png" />;
    return (
      <div className="goal_action">
        <div className="goal_action_left_name">{this.teamNames[0]} {balls[0]}</div>
        <div className="goal_action_right_name">{balls[1]} {this.teamNames[1]}</div>
        <div className="goal_action_text">{this.newScore[0]+' - '+this.newScore[1]}</div>
      </div>
    );
  } else if (this.points == -1) {
    return ['Fjern et point fra ',this.teamName];
  } else {
    // This case is never reached
    return ['Tilføj score ', this.points, ' til team ', this.teamIndex,
           ' i sæt ', this.setIndex];
  }
};

//-----------------------------------------------------------------------------
// Command for adding, changing or removing a timeout

function ChangeTimeout(st, setIndex, teamIndex, timeoutData, timeoutIndex) {
  this.setIndex = setIndex;
  this.teamIndex = teamIndex;
  this.timeoutData = timeoutData ? [].slice.call(timeoutData) : null;
  this.timeoutIndex = timeoutIndex;
  this.teamName = st.game.teams[teamIndex].name;
  this.oldTimeout = null;
  var set = st.sets[setIndex];
  var teamTimeouts = set.teams[teamIndex].timeouts;
  if (teamTimeouts && teamTimeouts[timeoutIndex]) {
    this.oldTimeout = [].slice.call(teamTimeouts[timeoutIndex]);
  }
}

ChangeTimeout.prototype.execute = function (st) {
  st.sets[this.setIndex].teams[this.teamIndex].timeouts[this.timeoutIndex] = (
    this.timeoutData);
};

ChangeTimeout.prototype.undo = function (st) {
  var set = st.sets[this.setIndex];
  set.teams[this.teamIndex].timeouts[this.timeoutIndex] = this.oldTimeout;
};

function timeoutEquals(t1, t2) {
  if (t1 === t2) return true;
  if (!t1 || !t2) return false;
  return (t1[0] == t2[0] && t1[1] == t2[1]);
}

ChangeTimeout.prototype.inverts = function (other) {
  return (other instanceof ChangeTimeout
          && timeoutEquals(this.oldTimeout, other.timeoutData)
          && timeoutEquals(this.timeoutData, other.oldTimeout))
};

ChangeTimeout.prototype.noop = function () {
  return timeoutEquals(this.timeoutData, this.oldTimeout);
};

ChangeTimeout.prototype.description = function () {
  if (!this.timeoutData) {
    return ['Slet timeout for hold ',this.teamName];
  } else if (!this.oldTimeout) {
    return [this.teamName,' kalder timeout ved stilling ',this.timeoutData[0],
      ' - ',this.timeoutData[1]];
  } else {
    return ['Du ændrede timeout for ', this.teamName,
      ' fra ',this.oldTimeout[0],' - ',this.oldTimeout[1],
      ' til ',this.timeoutData[0],' - ',this.timeoutData[1]];
  }
};

//-----------------------------------------------------------------------------
// Command for adding a substitution

function SubstitutionCommand(st, setIndex, teamIndex, playerIn, playerOut) {
  this.setIndex = setIndex;
  this.teamIndex = teamIndex;
  this.teamName = st.game.teams[teamIndex].name;
  this.playerIn = playerIn;
  this.playerOut = playerOut;
}

SubstitutionCommand.prototype.execute = function (st) {
  var currentSet = st.sets[this.setIndex];
  var currentTeamSet = currentSet.teams[this.teamIndex];
  var lineup = currentTeamSet.lineup;
  console.log(lineup, this.playerOut);
  for (var i = 0; i < lineup.length; ++i) {
    if (lineup[i] == this.playerOut) {
      lineup[i] = this.playerIn;
    }
  }
  currentTeamSet.subs.push([this.playerIn, this.playerOut]);
};

SubstitutionCommand.prototype.undo = function (st) {
  var currentSet = st.sets[this.setIndex];
  var currentTeamSet = currentSet.teams[this.teamIndex];
  var lineup = currentTeamSet.lineup;
  for (var i = 0; i < lineup.length; ++i) {
    if (lineup[i] == this.playerIn) {
      lineup[i] = this.playerOut;
    }
  }
  currentTeamSet.subs.pop();
};

SubstitutionCommand.prototype.inverts = function (other) {
  return false;
};

SubstitutionCommand.prototype.noop = function () {
  return false;
};

SubstitutionCommand.prototype.description = function () {
  return <div>{this.teamName} udskifter {this.playerOut} med {this.playerIn}</div>;
};

function PersistentStorage(key) {
  this._key = key;
  this.persistent = !!window.localStorage;
  this._value = null;
}

PersistentStorage.prototype.get = function () {
  var v;
  if (this.persistent)
    v = JSON.parse(window.localStorage.getItem(this._key));
  else
    v = this._value;
  console.log("Load",v);
  return v;
};

PersistentStorage.prototype.set = function (v) {
  console.log("Store",v);
  if (this.persistent)
    window.localStorage.setItem(this._key, JSON.stringify(v));
  else
    this._value = v;
};

var currentGameStorage = new PersistentStorage('current_matchform_state');

///////////////////////////////////////////////////////////////////////////////
// React Component implementations.
///////////////////////////////////////////////////////////////////////////////

var GameStateManager = React.createClass({
  getInitialState: function () {
    if (currentGameStorage.get()) {
      return {state: 'matchform'};
    } else {
      return {state: 'setup'};
    }
  },
  render: function () {
    var st = this.state.state;
    var setState = function (v) {
      this.replaceState({state: v});
    };
    if (st == 'matchform') {
      return <MatchForm onExit={setState.bind(this, 'setup')} />;
    } else {
      // setup
      return <SetupForm onEnter={setState.bind(this, 'matchform')} />;
    }
  }
});

var SetupForm = React.createClass({
  render: function () {
    return (
      <div className="screen setup">
        <div className="setup_header">Volleyball-opsætning</div>

        <SetupFormForm onSubmit={this.props.onEnter} />
      </div>
    );
  },
});

var SetupFormForm = React.createClass({
  getEmptyState: function () {
    function initialTeamState() {
      var players = [];
      for (var i = 1; i <= MAXPLAYERNUMBER; ++i) {
        players.push({number: i, name: ''});
      }
      return {
        name: '',
        players: players
      };
    }
    return {
      team1: initialTeamState(),
      team2: initialTeamState()
    };
  },

  existingTeamState: function (team) {
    var existing = {};
    for (var i = 0; i < team.players.length; ++i) {
      existing[team.players[i].number] = team.players[i].name;
    }
    var players = [];
    for (var i = 1; i <= MAXPLAYERNUMBER; ++i) {
      players.push({number: i, name: existing[i] || ''});
    }
    return {
      name: team.name,
      players: players
    };
  },

  getInitialState: function () {
    var v = currentGameStorage.get();
    if (!v) return this.getEmptyState();
    return {
      team1: this.existingTeamState(v.game.teams[0]),
      team2: this.existingTeamState(v.game.teams[1])
    };
  },

  render: function () {
    var stateAccessor = function () { return this.state; }.bind(this);
    var evaluate = function (f) { return f(); };
    var extend = function (f, k) { return function () { return f()[k]; }; };

    var updateState = function (accessor, k, v) {
      evaluate(accessor)[k] = v;
      this.replaceState(this.state);
    };

    var dataLink = function (accessor, k) {
      return {
        value: accessor()[k],
        requestChange: updateState.bind(this, accessor, k),
        subLink: dataLink.bind(this, extend(accessor, k))
      };
    }.bind(this);

    var nonemptyName = function (player) {
      return player.name != '';
    };

    var playerCount = function (team) {
      return team.players.filter(nonemptyName).length;
    };

    var players = [this.state.team1, this.state.team2].map(playerCount);

    var resetButton = (
      <TouchButton
        className="setup_button_reset"
        onClick={this.clear}>
        Ryd alt
      </TouchButton>
    );

    if (players[0] == 0 && players[1] == 0
        && this.state.team1.name == ''
        && this.state.team2.name == '')
    {
      resetButton = (
        <TouchButton
          className="setup_button_reset"
          onClick={this.autoFill}>
          Autofill
        </TouchButton>
      );
    }

    return (
      <div>
        <div className="setup_buttons">
          <TouchButton
            className="setup_button_submit"
            onClick={this.submit}>
            Start spillet
          </TouchButton>
          {resetButton}
        </div>
        <div
          className="setup_team team_left">
          <div className="setup_team_header">Hold A ({players[0]})</div>
          <SetupPlayerList
            valueLink={dataLink(stateAccessor, 'team1')} />
        </div>
        <div
          className="setup_team team_right">
          <div className="setup_team_header">Hold B ({players[1]})</div>
          <SetupPlayerList
            valueLink={dataLink(stateAccessor, 'team2')} />
        </div>
      </div>
    );
  },

  clear: function () {
    this.replaceState(this.getEmptyState());
  },

  autoFill: function () {
    // Supply some default values

    function make_player_list(names_string) {
      var names = names_string.split(' ');
      var numbers = [1, 2, 7, 8, 12, 23, 4, 10, 15, 19];
      var players = [];
      for (var i = 0; i < names.length; ++i) {
        players.push({number: numbers[i], name: names[i]});
      }
      return players;
    }

    st = {
      team1: this.existingTeamState({
        name: 'ASV 7',
        players: make_player_list(
          'Mathias Christina Diana Mette Karina Christian Martin Steffen')
      }),
      team2: this.existingTeamState({
        name: 'Viborg',
        players: make_player_list(
          'Anja Amalie Jonas Mie Oliver '
          +'Rasmus Asger Benedikte Alexandra Dennis')
      })
    };

    this.replaceState(st);
  },

  submit: function () {
    function nonemptyName(s) {
      return s.name != '';
    }

    function generateSetTeam(team) {
      return {
        score: 0,
        subs: [],
        timeouts: [null, null],
        lineup: team.players.slice(0, FIELDPLAYERS).map(
          function (player) { return player.number; })
      };
    }

    function generateSet(teams) {
      var set = {
        teams: teams.map(generateSetTeam),
        serve: 0
      };
      return set;
    }

    var st = this.state;

    var teams = [
      {name: st.team1.name, players: st.team1.players.filter(nonemptyName)},
      {name: st.team2.name, players: st.team2.players.filter(nonemptyName)}
    ];

    var storedState = {
      showSubstitutionTeamIndex: -1,
      currentSetIndex: 0,
      game: {
        teams: teams
      },
      sets: [generateSet(teams), generateSet(teams), generateSet(teams)],
      actions: [],
      redoStack: []
    };
    currentGameStorage.set(storedState);
    this.props.onSubmit();
  }
});

var SetupPlayerList = React.createClass({
  render: function () {
    var dataLink = function (k) {
      return this.props.valueLink.subLink(k);
    }.bind(this);
    var playerLink = dataLink('players');
    var players = playerLink.value.map(
      function (player, i) {
        var l = playerLink.subLink(i);
        return (
          <li value={l.value.number} key={i}>
            <input type="text"
              valueLink={l.subLink('name')} />
          </li>
        );
      }
    );

    return (
      <div className="setup_player_list">
        <div>Navn: <input type="text" valueLink={dataLink('name')} /></div>
        <ol>
          {players}
        </ol>
      </div>
    );
  }
});

//-----------------------------------------------------------------------------
// The root component, implementing the game state (aka. game model) and
// displaying all UI components.

var MatchForm = React.createClass({
  getInitialState: function () {
    return currentGameStorage.get();
  },

  redoAction: function () {
    var st = this.state;
    if (!st.redoStack || !st.redoStack.length) return;
    var action = st.redoStack[st.redoStack.length-1];
    st.redoStack.pop();
    st.actions.push(action);
    action.execute(st);
    this.replaceState(st);
    this.saveState();
  },

  pushAction: function (action) {
    var st = this.state;
    if (st.actions.length > 0
        && action.inverts
        && action.inverts(st.actions[st.actions.length-1]))
    {
      this.popAction();
    } else if (!action.noop || !action.noop()) {
      st.actions.push(action);
      action.execute(st);
      st.redoStack = [];
      this.replaceState(st);
      this.saveState();
    }
  },

  popAction: function () {
    var st = this.state;
    if (st.actions.length > 0) {
      var action = st.actions[st.actions.length-1];
      st.actions.pop();
      action.undo(st);
      st.redoStack.push(action);
      this.replaceState(st);
    }
  },

  saveState: function () {
    var st = this.state;
    var storedState = {
      showSubstitutionTeamIndex: -1,
      currentSetIndex: st.currentSetIndex,
      game: st.game,
      sets: st.sets,
      actions: [],
      redoStack: []
    };
    currentGameStorage.set(storedState);
  },

  getNextSet: function() {
    var st = this.state;
    if(st.currentSetIndex >= st.sets.length) {
      return st.sets.length -1;
    }
    return st.currentSetIndex + 1;
  },

  render: function () {
    var addScore = function (teamIndex, points) {
      this.pushAction(
        new AddScore(this.state, this.state.currentSetIndex, teamIndex, points));
    }.bind(this);

    var changeTimeout = function (setIndex, teamIndex, timeoutData, timeoutIndex) {
      this.pushAction(new ChangeTimeout(this.state, setIndex, teamIndex, timeoutData, timeoutIndex));
    }.bind(this, this.state.currentSetIndex);

    var nextSetButton;
    if (this.getNextSet() != this.state.sets.length) {
      var className = 'next_button';
      if (this.getSetWinner(this.state.currentSetIndex) != -1) {
        className += ' next_button_active';
      }
      nextSetButton = (
        <TouchButton
          onClick={this.changeSet.bind(this, +1)}
          className={className}>
          Start sæt {this.getNextSet() + 1}
        </TouchButton>
      );
    } else {
      nextSetButton = (
        <TouchButton
          className="next_button"
          disabled="true">
          Der er ikke flere sæt
        </TouchButton>
      );
    }

    var modal;

    if (this.state.showSubstitutionTeamIndex != -1) {
      var currentSet = this.state.sets[this.state.currentSetIndex];
      var currentTeamSet = currentSet.teams[this.state.showSubstitutionTeamIndex];
      var currentLineup = currentTeamSet.lineup;
      var players = (this.state.game.teams[this.state.showSubstitutionTeamIndex]
                     .players);

      var onSubmit = function (playerInNumber, playerOutNumber) {
        var teamIndex = this.state.showSubstitutionTeamIndex;

        this.setState({showSubstitutionTeamIndex: -1});

        this.pushAction(new SubstitutionCommand(
          this.state, this.state.currentSetIndex, teamIndex,
          playerInNumber, playerOutNumber));

      }.bind(this);

      var onCancel = function () {
        this.setState({showSubstitutionTeamIndex: -1});
      }.bind(this);

      modal = (
        <div className="modal">
          {SubstitutionsModal.renderHeader()}

          <div className="modal_contents">
            <SubstitutionsModal
            currentLineup={currentLineup}
            players={players}
            onSubmit={onSubmit}
            onCancel={onCancel}
            />
          </div>
        </div>
      );
    } else {
      modal = (
        <div className="modal">

          {ActionList.renderHeader()}

          <div className="modal_contents">
            <ActionList actions={this.state.actions} redoStack={this.state.redoStack} onUndo={this.popAction} onRedo={this.redoAction} />

            <Results game={this.state.game} sets={this.state.sets} currentSet={this.state.currentSetIndex}/>

          </div>

          {nextSetButton}
          <div style={{position: 'absolute', bottom: 0, left: 0, right: 0}}>
            <TouchButton onClick={this.props.onExit}>Forlad spillet</TouchButton>
            <span id="messages" />
          </div>

        </div>
      );
    }

    var currentSet = this.state.sets[this.state.currentSetIndex];
    var lineupLink = {
      value: [currentSet.teams[0].lineup, currentSet.teams[1].lineup],
      requestChangeIndex: function (i, v) {
        var currentSet = this.state.sets[this.state.currentSetIndex];
        console.log(i);
        currentSet.teams[i].lineup = v;
        this.replaceState(this.state);
      }.bind(this)
    };

    return (
    <div className="screen">

    <CurrentSet
      number={this.state.currentSetIndex}
      game={this.state.game}
      set={currentSet}
      lineupLink={lineupLink}
      matchScore={this.getMatchScore()}
      onAddScore={addScore}
      onTimeoutChange={changeTimeout}
      onSubstitution={this.showSubstitutionModal}
      />

      {modal}

      <TouchButton
        className="reload_button"
        onClick={function () {location.reload();}}>
        <img src="reload.svg" style={{width: 20, height: 20}} />
      </TouchButton>

    </div>
    );
  },

  // Event callback
  changeSet: function (delta) {
    this.changeSetSpecific(this.state.currentSetIndex + delta);
  },
  
  changeSetSpecific: function(set) {
    var st = this.state;
    //boundary check
    if(set >= st.sets.length) {
      set = st.sets.length -1;
    }
    if(set < 0) {
      set = 0;
    }
    var action = new StartSet(st, set);
    this.pushAction(action);
  },

  showSubstitutionModal: function (teamIndex) {
    this.setState({showSubstitutionTeamIndex: teamIndex});
  },

  getSetWinner: function (setIndex) {
    var s1 = this.state.sets[setIndex].teams[0].score;
    var s2 = this.state.sets[setIndex].teams[1].score;
    return getSetWinner(setIndex, s1, s2);
  },

  // Computed property
  getMatchScore: function () {
    var setsWon = [0,0];
    for (var i = 0; i <= this.state.currentSetIndex; ++i) {
      var winner = this.getSetWinner(i);
      if (winner != -1) setsWon[winner]++;
    }
    return setsWon;
  }
});

//-----------------------------------------------------------------------------
// Component for the left-hand side of the screen, showing the current set.

var CurrentSet = React.createClass({
  getInitialState: function () {
    return {swapped: false};
  },
  /*
  propTypes: {
    number: React.PropTypes.number.isRequired,
    set: React.PropTypes.shape([
      {
        score: React.PropTypes.number,
        lineup: React.PropTypes.arrayOf(React.PropTypes.number),
        timeouts: React.PropTypes.arrayOf
      },
      {score: React.PropTypes.number}
    ]).isRequired,
    game: React.PropTypes.shape({
      teams: React.PropTypes.shape([
        React.PropTypes.string,
        React.PropTypes.string
      ])
    }).isRequired,
    onAddScore: React.PropTypes.func.isRequired,
    onTimeoutChange: React.PropTypes.func.isRequired,
    matchScore: React.PropTypes.shape([
      React.PropTypes.number,
      React.PropTypes.number
    ]).isRequired
  },
  */
  render: function () {
    var number = this.props.number + 1;
    var set = this.props.set;
    var game = this.props.game;
    var currentScore = [set.teams[0].score, set.teams[1].score];

    var teamSets = [];
    var sides = ['left', 'right'];
    for (var j = 0; j < 2; ++j) {
      var i = this.state.swapped ? (1-j) : j;
      var lineupLink = {
        value: this.props.lineupLink.value[i],
        requestChange: function (i, v) {
          this.props.lineupLink.requestChangeIndex(i, v);
        }.bind(this, i)
      };
      var name = game.teams[i].name;
      var onScorePlus = this.props.onAddScore.bind(this, i, 1);
      var onScoreMinus = this.props.onAddScore.bind(this, i, -1);
      var onTimeoutChange = this.props.onTimeoutChange.bind(this, i);
      var onNewTimeout = this.props.onTimeoutChange.bind(this, i, currentScore);
      var onSubstitution = this.props.onSubstitution.bind(this, i);
      var serve = set.serve;
      teamSets.push(
        <TeamSet key={i} serve={serve === i}
          side={sides[j]} teamName={name} set={set.teams[i]}
          lineupLink={lineupLink}
          matchScore={this.props.matchScore[i]}
          onScorePlus={onScorePlus} onScoreMinus={onScoreMinus}
          onTimeoutChange={onTimeoutChange} onNewTimeout={onNewTimeout}
          onSubstitution={onSubstitution}
          />
      );
    }

    return (
      <div className="set">

      <div className="set_header">Sæt {number}</div>

      <button className="set_swap_sides" onClick={this.swap}>
        <img src="swap.svg" style={{width: 32, height: 32}} />
      </button>

      {teamSets}

      </div>
      );

  },

  swap: function () {
    this.setState({swapped: !this.state.swapped});
  }
});

//-----------------------------------------------------------------------------
// Subcomponent of CurrentSet, showing one of the teams.

var TeamSet = React.createClass({
  render: function () {
    var score = this.props.set.score;
    var timeouts = this.props.set.timeouts;
    var timeoutButtons = [];
    for (var i = 0; i < TIMEOUTS; ++i) {
      var c = "set_score_timeout timeout_"+(i+1);
      if (timeouts[i]) {
        var onChange = function (i, s1, s2) {
          this.props.onTimeoutChange([s1, s2], i);
        }.bind(this, i);
        timeoutButtons.push(<TimeoutButton key={i} className={c} score={timeouts[i]} onChange={onChange} />);
      } else {
        var onClick = function (i, s1, s2) {
          this.props.onNewTimeout(i);
        }.bind(this, i);
        timeoutButtons.push(<TouchButton key={i} className={c} onClick={onClick}>T-O</TouchButton>);
      }
    }
    var serve = null;
    if (this.props.serve) {
      serve = <img src="ball.png" className="set_serve" />;
    }
    var lineupLink = this.props.lineupLink;
    return (
    <div className={"set_team team_"+this.props.side}>
      <div className="set_score">
        <div className="set_team_name">
          {this.props.teamName}
          {serve}
        </div>
        <TouchButton className="set_score_button" onClick={this.props.onScorePlus}>
          <div className="set_score_button_score">{score}</div>
          <div className="set_score_button_label">+1</div>
        </TouchButton>
        <TouchButton className="set_score_decrement" onClick={this.props.onScoreMinus}>
          <div className="set_score_decrement_label">&minus;1</div>
        </TouchButton>
        {timeoutButtons}
      </div>
      <div className="set_match_score">{this.props.matchScore}</div>

      <Substitutions subs={this.props.set.subs}
        onAdd={this.props.onSubstitution} />

      <CurrentLineup serve={serve} lineupLink={lineupLink} score={score} />
    </div>
    );
  }
});

//-----------------------------------------------------------------------------
// Subcomponent of TeamSet, showing a button for editing a timeout.

var TimeoutButton = React.createClass({
  getInitialState: function () {
    return {changing: false};
  },
  render: function () {
    if (!this.state.changing) {
      var score = this.props.score;
      return <TouchButton className={this.props.className} onClick={this.startChange}>{score[0]}-{score[1]}</TouchButton>;
    } else {
      var score = this.state.score;
      return (
        <div className={this.props.className+' changing'} onClick={this.stopChange}>
          <Scroller value={score[0]} min={0} max={25} onChange={this.setValue.bind(this, 0)} />
          -
          <Scroller value={score[1]} min={0} max={25} onChange={this.setValue.bind(this, 1)} />
        </div>
      );
    }
  },

  // Event callback
  startChange: function () {
    this.replaceState({
      changing: true,
      score: [this.props.score[0], this.props.score[1]]
    });
  },

  // Event callback
  stopChange: function () {
    var st = this.state;
    this.props.onChange(st.score[0], st.score[1]);
    this.replaceState({
      changing: false
    });
  },

  // Event callback
  setValue: function (i, value) {
    var st = this.state;
    if (!st.changing) return;
    if (st.score[i] == value) return;
    st.score[i] = value;
    this.replaceState(st);
  }
});

//-----------------------------------------------------------------------------
// Reusable form component for choosing an integer from a scrollable list.

var Scroller = React.createClass({
  render: function () {
    var values = [];
    for (var i = this.props.min; i <= this.props.max; ++i) {
      var c = (i == this.props.value) ? 'scroller_value scroller_selected' : 'scroller_value';
      values.push(<div className={c}>{i}</div>);
    }
    return <div onWheel={this.onWheel} onScroll={this.onScroll} className='scroller'>{values}</div>;
  },
  componentDidMount: function () {
    // Called when the component has been rendered for the first time
    this.scrollTo(this.props.value);
  },

  // Helper method
  scrollTo: function (value) {
    var elt = this.getDOMNode();
    if (!elt) return false;
    var idx = value - this.props.min;
    var c = elt.childNodes[idx];
    if (!c) return false;
    elt.scrollTop = c.offsetTop + c.offsetHeight / 2 - elt.offsetHeight / 2;
    return true;
  },

  // Event callback
  onWheel: function (e) {
    var elt = this.getDOMNode();
    var down = (e.deltaX == 0 && e.deltaY > 0);
    var up = (e.deltaX == 0 && e.deltaY < 0);
    if (elt && (up || down)) {
      var value = up ? (this.props.value - 1) : (this.props.value + 1);
      if (this.scrollTo(value)) {
        this.props.onChange(value);
        e.preventDefault();
        e.stopPropagation();
      }
    }
  },

  // Event callback
  onScroll: function () {
    var elt = this.getDOMNode();
    var selectedIndex = -1;
    var tgt = elt.scrollTop + elt.offsetHeight / 2;
    for (var i = this.props.min; i <= this.props.max; ++i) {
      var c = elt.childNodes[i - this.props.min];
      var y1 = c.offsetTop;
      var y2 = y1 + c.offsetHeight;
      if (y1 <= tgt && tgt <= y2) {
        selectedIndex = i - this.props.min;
        break;
      }
    }
    if (selectedIndex != -1 && selectedIndex + this.props.min != this.props.value) {
      this.props.onChange(selectedIndex + this.props.min);
    }
  }
});

//-----------------------------------------------------------------------------
// Subcomponent of TeamSet for showing the list of substitutions.

var Substitutions = React.createClass({
  render: function () {
    var cells = [];
    var subs = this.props.subs;
    for (var i = 0; i < SUBSTITUTIONS; ++i) {
      if (i < subs.length) {
        var s = subs[i];
        cells.push(
          <Substitution key={i} in_={s[0]} out={s[1]} />
        );
      } else if (i == subs.length) {
        cells.push(
          <div key={i} className="set_substitutions_cell">
            <TouchButton className="set_substitutions_cell_add"
              onClick={this.props.onAdd}>
            +
            </TouchButton>
          </div>
        );
      } else {
        cells.push(
          <div key={i} className="set_substitutions_cell" />
        );
      }
    }
    return (
      <div className="set_substitutions">
        <div className="set_substitutions_title">Udskiftninger</div>
        {cells}
      </div>
      );
  }
});

//-----------------------------------------------------------------------------
// Subcomponent of Substitutions.

var Substitution = React.createClass({
  render: function () {
    return (
      <div className="set_substitutions_cell">
        <div className="set_substitutions_cell_in">{this.props.in_}</div>
        <div className="set_substitutions_cell_in_label">Ind</div>
        <div className="set_substitutions_cell_out">{this.props.out}</div>
        <div className="set_substitutions_cell_out_label">Ud</div>
      </div>
      );
  }
});

//-----------------------------------------------------------------------------
// Subcomponent of TeamSet for showing the current lineup.

var CurrentLineup = React.createClass({
  render: function () {
    var indices =
      [3, 2, 1,
       4, 5, 0];
    var cells = [];
    var score = this.props.score;
    var players = indices.length;
    var lineup = this.props.lineupLink.value;
    for (var i = 0; i < players; ++i) {
      var j = lineup[indices[i]];
      var serve = ((indices[i] == 0 && this.props.serve)
        ? <img src="ball.png" className="set_lineup_serve" />
        : null);
      cells.push(
        <div key={j} className="set_lineup_cell">
          {j} {serve}
        </div>
      );
    }
    return (
      <div className="set_lineup">
        <div className="set_lineup_title">
          Opstilling
        </div>
        <div className="set_lineup_rotate">
          <TouchButton onClick={this.rotate_cw}>
            <img src="rotate-cw.svg" style={{width: 20, height: 20}} />
          </TouchButton>
          <TouchButton onClick={this.rotate_ccw}>
            <img src="rotate-ccw.svg" style={{width: 20, height: 20}} />
          </TouchButton>
        </div>
        {cells}
      </div>
      );
  },
  rotate: function (amount) {
    var lineup = this.props.lineupLink.value;
    amount = (amount + lineup.length) % lineup.length;
    var a = lineup.slice(0, amount);
    var b = lineup.slice(amount);
    lineup = b;
    lineup.push.apply(lineup, a);
    this.props.lineupLink.requestChange(lineup);
  },
  rotate_cw: function () {
    this.rotate(1);
  },
  rotate_ccw: function () {
    this.rotate(-1);
  }
});

//-----------------------------------------------------------------------------
// Right hand side of the screen when a substitution is being added.

var SubstitutionsModal = React.createClass({
  getInitialState: function () {
    return {
      selected1: null,
      selected2: null
    };
  },
  render: function () {
    var currentLineup = this.props.currentLineup;
    var players = this.props.players;

    var currentBench = players.map(
      function (pl) { return pl.number; }).filter(
      function (n) { return -1 == currentLineup.indexOf(n); });

    var updateState = function (k, v) {
      this.setState({k: v});
    }.bind(this);

    var dataLink = function (k) {
      return {
        value: this.state[k],
        requestChange: updateState.bind(this, k)
      };
    }.bind(this);

    var confirmSubstitution = function () {
      this.props.onSubmit(this.state.selected1, this.state.selected2);
    }.bind(this);

    var cancelSubstitution = function () {
      this.props.onCancel();
    }.bind(this);

    var msg = 'Vælg hvilke spillere, der skiftes ud';
    var confirmButton = [];

    if (this.state.selected1 !== null && this.state.selected2 !== null) {
      msg = ('Spiller nr. '+this.state.selected1+' kommer ind, og ' +
             'spiller nr. '+this.state.selected2+' går ud.');
      confirmButton = (
        <TouchButton
          className='subs_confirm_button'
          onClick={confirmSubstitution}>
          Bekræft udskiftning
        </TouchButton>
      );
    }

    return (
      <div>
        <SubstitutionsPlayerList
          side="in"
          players={players}
          highlight={currentBench}
          selectedLink={dataLink('selected1')}
          />
        <SubstitutionsPlayerList
          side="out"
          players={players}
          highlight={currentLineup}
          selectedLink={dataLink('selected2')}
          />
        <div className='subs_confirm'>
          <div className='subs_confirm_message'>{msg}</div>
          {confirmButton}
          <TouchButton
            className='subs_cancel_button'
            onClick={cancelSubstitution}>
            Fortryd
          </TouchButton>
        </div>
      </div>
    );
  },
  statics: {
    renderHeader: function () {
      return <div className="modal_header">Udskiftning</div>;
    }
  }
});

//-----------------------------------------------------------------------------
// Subcomponent of SubstitutionsModal for showing one of the two player lists.

var SubstitutionsPlayerList = React.createClass({
  render: function () {
    var className = 'subs_column subs_column_'+this.props.side;
    var selected = this.props.selectedLink.value;
    var onPlayerClick = function (i) {
      this.props.selectedLink.requestChange(i);
    };

    var numbers = this.props.players.map(
      function (p) { return p.number; });

    var playerObjects = [];
    for (var i = 0; i < this.props.players.length; ++i) {
      var player = this.props.players[i];
      var cl = "subs_player subs_known";
      if (this.props.highlight.indexOf(player.number) == -1) {
        cl += ' subs_invalid';
      }
      playerObjects.push({
        number: player.number,
        name: player.name,
        className: cl
      });
    }
    playerObjects.push(null); // divider
    for (var i = 1; i <= MAXPLAYERNUMBER; ++i) {
      if (numbers.indexOf(i) != -1) continue;
      playerObjects.push({
        number: i,
        name: '',
        className: "subs_player subs_unknown"
      });
    }

    var players = [];
    for (var i = 0; i < playerObjects.length; ++i) {
      var o = playerObjects[i];
      if (o === null) {
        players.push(<div key={-1} className="subs_divider" />);
      } else {
        var cl = o.className;
        if (o.number == selected) {
          console.log("Found selected");
          cl += ' subs_selected';
        }
        players.push(
          <TouchButton key={o.number} className={cl} onClick={onPlayerClick.bind(this, o.number)}>
            <span className='subs_playernumber'>{o.number}.</span>
            {' '}
            <span className='subs_playername'>{o.name}</span>
          </TouchButton>
        );
      }
    }

    var labels = {'in': 'Ind', 'out': 'Ud'};

    return (
      <div className={className}>
        <h1>{labels[this.props.side]}</h1>
        <div className='subs_list'>
          {players}
        </div>
      </div>
    );
  }
});

//-----------------------------------------------------------------------------
// Component for the right-hand side of the screen, showing the action list
// and the big undo button.

var ActionList = React.createClass({
  render: function () {
    actions = [].slice.call(this.props.actions);
    actions.reverse();
    actions = actions.map(function (act, i) {
      return <li key={i}>{act.description()}</li>;
    });
    var redoClassName = 'actions_redo';
    if (!this.props.redoStack || !this.props.redoStack.length) {
      redoClassName += ' actions_redo_disabled';
    }
    return (
        <div className="actions">
          <ul ref="contents" className="actions_list">
          {actions}
          </ul>

          <TouchButton className="actions_undo" onClick={this.props.onUndo}>
          Slet sidste handling</TouchButton>
          <TouchButton className={redoClassName} onClick={this.props.onRedo}>
          Fortryd slet</TouchButton>
        </div>
    );
  },
  /*
  componentWillUpdate: function () {
    var el = this.refs.contents.getDOMNode();
    //console.log("Before update:",el,el.scrollHeight,el.scrollTop);
    this.scrollBottom = el.scrollHeight - el.scrollTop;
  },
  */
  componentDidUpdate: function () {
    var el = this.refs.contents.getDOMNode();
    //console.log("After update:",el,el.scrollHeight,el.scrollTop);
    //el.scrollTop = el.scrollHeight - this.scrollBottom;
    el.scrollTop = 0;
  }
});

ActionList.renderHeader = function () {
  return <div className="modal_header">Handlinger</div>;
};

//-----------------------------------------------------------------------------
// Component for the right-hand side of the screen, showing the match results.

var Results = React.createClass({
  render: function () {
    var sets = [];
    for (var i = 0; i < SETS; ++i) {
      var set = this.props.sets[i] || {};
      sets.push([(set.teams[0].score | 0) || 0, (set.teams[1].score | 0) || 0]);
    }
    var rows = [];
    for (var i = 0; i < sets.length; ++i) {
      var winner = getSetWinner(i, sets[i][0], sets[i][1]);
      var c0 = (winner == 0) ? 'results_winner' : '';
      var c1 = (winner == 1) ? 'results_winner' : '';
      rows.push(
        <tr key={i} className={this.props.currentSet == i ? "active_set" : ""}>
          <td className="results_set">Sæt {i+1}</td>
          <td className={c0}>{sets[i][0]}</td>
          <td className={c1}>{sets[i][1]}</td>
        </tr>
      );
    }
    var sums = [0,0];
    for (var i = 0; i < sets.length; ++i) {
      sums[0] += sets[i][0];
      sums[1] += sets[i][1];
    }
    return (
        <div className="results">
          <div className="results_header">Resultat</div>

          <table className="results_table" cellSpacing="8">
            <col span="3" width="33%" />
            <tr>
              <th className="results_topleft"></th>
              <th>{this.props.game.teams[0].name}</th>
              <th>{this.props.game.teams[1].name}</th>
            </tr>
            {rows}
            <tr className="results_totals">
              <td className="results_set">Bolde i alt</td>
              <td className="results_total">{sums[0]}</td>
              <td className="results_total">{sums[1]}</td>
            </tr>
          </table>

        </div>
    );
  }
});

//-----------------------------------------------------------------------------
// Reusable component for a <button> DOM object with touch event handlers.

var TouchButton = React.createClass({
  getDefaultProps: function () {
    return {onClick: function () {}};
  },
  getInitialState: function () {
    return {touching: false};
  },
  render: function () {
    var className = this.state.touching ? 'button_active ' : '';
    className += this.props.className;
    return this.transferPropsTo(
      <button onClick={this.onClick}
      onTouchStart={this.onTouchStart}
      onTouchMove={this.onTouchMove}
      onTouchEnd={this.onTouchEnd}
      className={className}
      >
      {this.props.children}
      </button>
    );
  },
  onClick: function (e) {
    if (this.props.onClick)
      this.props.onClick(e);
  },
  onTouchStart: function (e) {
    if (e.touches.length != 1) {
      this.replaceState({touching: false});
      return;
    }
    this.replaceState({
      touching: true,
      identifier: e.touches[0].identifier,
      target: this.getDOMNode()
    });
    e.preventDefault();
  },
  onTouchMove: function (e) {
    if (this.state.touching
        && e.touches.length == 1
        && e.touches[0].identifier == this.state.identifier)
    {
      e.preventDefault();
      var touch = e.touches[0];
      var tgt = document.elementFromPoint(touch.pageX, touch.pageY);
      if (!this.state.target.contains(tgt)) {
        //console.log("moved outside target "+this.state.target.className+" "+tgt.className);
        this.replaceState({touching: false});
      }
    }
  },
  onTouchEnd: function (e) {
    //console.log('end '+e.changedTouches.length+' '+this.changedTouches[0].identifier+' '+e);
    if (this.state.touching
        && e.changedTouches.length == 1
        && e.changedTouches[0].identifier == this.state.identifier)
    {
      if (this.props.onClick)
        this.props.onClick();

      // preventDefault *should* prevent the cascade
      // into mouse events and click event.
      e.preventDefault();
    }
    this.replaceState({touching: false});
  }
});

///////////////////////////////////////////////////////////////////////////////
// Runtime initialization.
///////////////////////////////////////////////////////////////////////////////

React.initializeTouchEvents(true);
React.renderComponent(<GameStateManager />, document.body);

window.addEventListener('touchstart', function (e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, false);
