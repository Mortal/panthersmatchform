/** @jsx React.DOM */
// vim:set ft=javascript sw=2 et:

var SETS = 3;
var SETSCORE = 25;
var TIMEOUTS = 2;
var SUBSTITUTIONS = 6;
var MAXPLAYERNUMBER = 30;



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

function StartSet(st, set) {
	this.lastSet = st.currentSetIndex;
	this.nextSet = set;
	if(set >= st.sets.length) {
		this.nextSet = st.sets.length - 1;
	}
}

StartSet.prototype.invert = function() {
	return false;
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

function AddScore(st, setIndex, teamIndex, points) {
  this.setIndex = setIndex;
  this.teamIndex = teamIndex;
  this.points = points;
  if (st.sets[setIndex][teamIndex].score + this.points < 0) {
    this.points = -st.sets[setIndex][teamIndex].score;
  }
  this.teamName = st.game.teams[teamIndex].name;
  this.teamNames = [st.game.teams[0].name, st.game.teams[1].name];
  var set = st.sets[setIndex];
  this.newScore = [set[0].score, set[1].score];
  this.newScore[teamIndex] += this.points;
}

AddScore.prototype.execute = function (st) {
  var newScore = st.sets[this.setIndex][this.teamIndex].score + this.points;
  st.sets[this.setIndex][this.teamIndex].score = newScore;
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
  var newScore = st.sets[this.setIndex][this.teamIndex].score - this.points;
  st.sets[this.setIndex][this.teamIndex].score = newScore;
};

AddScore.prototype.description = function () {
  if (this.points == 1) {
    var balls = ['', ''];
    balls[this.teamIndex] = <img src='ball.png' />;
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

function ChangeTimeout(st, setIndex, teamIndex, timeoutData, timeoutIndex) {
  this.setIndex = setIndex;
  this.teamIndex = teamIndex;
  this.timeoutData = timeoutData ? [].slice.call(timeoutData) : null;
  this.timeoutIndex = timeoutIndex;
  this.teamName = st.game.teams[teamIndex].name;
  this.oldTimeout = null;
  var set = st.sets[setIndex];
  var teamTimeouts = set[teamIndex].timeouts;
  if (teamTimeouts && teamTimeouts[timeoutIndex]) {
    this.oldTimeout = [].slice.call(teamTimeouts[timeoutIndex]);
  }
}

ChangeTimeout.prototype.execute = function (st) {
  st.sets[this.setIndex][this.teamIndex].timeouts[this.timeoutIndex] = (
    this.timeoutData);
};

ChangeTimeout.prototype.undo = function (st) {
  var set = st.sets[this.setIndex];
  set[this.teamIndex].timeouts[this.timeoutIndex] = this.oldTimeout;
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
    return ['Skift timeout for ', this.teamName,
      ' fra ',this.oldTimeout[0],' - ',this.oldTimeout[1],
      ' til ',this.timeoutData[0],' - ',this.timeoutData[1]];
  }
};

var MatchForm = React.createClass({
  getInitialState: function () {
    function make_player_list(names_string) {
      var names = names_string.split(' ');
      var numbers = [1, 2, 7, 8, 12, 23, 4, 10, 15, 19];
      var players = [];
      for (var i = 0; i < names.length; ++i) {
        players.push({number: numbers[i], name: names[i]});
      }
      return players;
    }

    return {
      showSubstitutionTeamIndex: 1,
      currentSetIndex: 0,
      game: {
        teams: [{
          name: 'ASV 7',
          players: make_player_list('Mathias Christina Diana Mette Karina Christian Martin Steffen')
        }, {
          name: 'Viborg',
          players: make_player_list('Anja Amalie Jonas Mie Oliver Rasmus Asger Benedikte Alexandra Dennis')
        }]
      },
      sets: [
        generateNewSet(),generateNewSet(), generateNewSet()
      ],
      actions: []
    };
  },

  pushAction: function (action) {
    var st = this.state;
    if (st.actions.length > 0
        && action.inverts
        && action.inverts(st.actions[st.actions.length-1]))
    {
      this.popAction();
    } else if (!action.noop()) {
      st.actions.push(action);
      action.execute(st);
      this.setState(st);
    }
  },

  popAction: function () {
    var st = this.state;
    if (st.actions.length > 0) {
      var action = st.actions[st.actions.length-1];
      st.actions.pop();
      action.undo(st);
      this.setState(st);
    }
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
      this.pushAction(new AddScore(this.state, this.state.currentSetIndex, teamIndex, points));
    }.bind(this);

    var changeTimeout = function (setIndex, teamIndex, timeoutData, timeoutIndex) {
      this.pushAction(new ChangeTimeout(this.state, setIndex, teamIndex, timeoutData, timeoutIndex));
    }.bind(this, this.state.currentSetIndex);
	
	var nextSetButton;
	if (this.getNextSet() != this.state.sets.length) {
		nextSetButton = <TouchButton onClick={this.changeSet.bind(this, +1)} className="next_button">Start sæt {this.getNextSet() + 1}</TouchButton>;
	} else {
		nextSetButton = <TouchButton onClick={this.changeSet.bind(this, +1)} className="next_button" disabled="true">Der er ikke flere sæt</TouchButton>;
	}

    var modal;

    if (this.state.showSubstitutionTeamIndex != -1) {
      var currentSet = this.state.sets[this.state.currentSetIndex];
      var currentTeamSet = currentSet[this.state.showSubstitutionTeamIndex];
      var currentLineup = currentTeamSet.lineup;
      var players = (this.state.game.teams[this.state.showSubstitutionTeamIndex]
                     .players);

      modal = (
        <div className="modal">
          {SubstitutionsModal.renderHeader()}

          <div className="modal_contents">
            <SubstitutionsModal
            currentLineup={currentLineup}
            players={players}
            />
          </div>
        </div>
      );
    } else {
      modal = (
        <div className="modal">

          {ActionList.renderHeader()}

          <div className="modal_contents">
            <ActionList actions={this.state.actions} onUndo={this.popAction} />

            <Results game={this.state.game} sets={this.state.sets} />

          </div>

          {nextSetButton}
          <div style={{position: 'absolute', bottom: 0, left: 0, right: 0}}>
            <TouchButton onClick={this.resetGame}>Start spillet forfra</TouchButton>
            <TouchButton onClick={this.changeSet.bind(this, -1)}>Forrige sæt</TouchButton>
            <TouchButton onClick={function () {location.reload();}}>Reload</TouchButton>
            <span id="messages" />
          </div>

        </div>
      );
    }



    return (
    <div className="screen">

    <CurrentSet
      number={this.state.currentSetIndex}
      game={this.state.game}
      set={this.state.sets[this.state.currentSetIndex]}
      matchScore={this.getMatchScore()}
      onAddScore={addScore}
      onTimeoutChange={changeTimeout}
      onSubstitution={this.showSubstitutionModal}
      />

      {modal}

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

  // Event callback
  resetGame: function () {
    function emptyTeamSet() { return {score: 0, subs: [], timeouts: [null, null], lineup: [1,2,3,4,5,6]}; }
    function emptySet() { return [emptyTeamSet(), emptyTeamSet()]; }
    this.setState({
      currentSetIndex: 0,
      game: {teams: [{name: 'ASV 7'}, {name: 'Viborg'}]},
      sets: [
        emptySet(), emptySet(), emptySet()
      ]
    });
  },

  showSubstitutionModal: function (teamIndex) {
    var st = this.state;
    st.showSubstitutionTeamIndex = teamIndex;
    this.setState(st);
  },

  // Computed property
  getMatchScore: function () {
    var setsWon = [0,0];
    for (var i = 0; i <= this.state.currentSetIndex; ++i) {
      var set = this.state.sets[i];
      if (set[0].score >= SETSCORE) setsWon[0]++;
      if (set[1].score >= SETSCORE) setsWon[1]++;
    }
    return setsWon;
  }
});

var CurrentSet = React.createClass({
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
    var currentScore = [set[0].score, set[1].score];

    var teamSets = [];
    var sides = ['left', 'right'];
    for (var i = 0; i < 2; ++i) {
      var name = game.teams[i].name;
      var onScorePlus = this.props.onAddScore.bind(this, i, 1);
      var onScoreMinus = this.props.onAddScore.bind(this, i, -1);
      var onTimeoutChange = this.props.onTimeoutChange.bind(this, i);
      var onNewTimeout = this.props.onTimeoutChange.bind(this, i, currentScore);
      var onSubstitution = this.props.onSubstitution.bind(this, i);
      teamSets.push(
        <TeamSet key={i} side={sides[i]} teamName={name} set={set[i]}
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

      {teamSets}

      </div>
      );

  }
});

var TeamSet = React.createClass({
  render: function () {
    var initialLineup = this.props.set.lineup;
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
    return (
    <div className={"set_team team_"+this.props.side}>
      <div className="set_score">
        <div className="set_team_name">{this.props.teamName}</div>
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

      <CurrentLineup initial={initialLineup} score={score} />
    </div>
    );
  }
});

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
    var st = this.state;
    st.changing = true;
    st.score = [this.props.score[0], this.props.score[1]];
    this.setState(st);
  },

  // Event callback
  stopChange: function () {
    var st = this.state;
    this.props.onChange(st.score[0], st.score[1]);
    st.changing = false;
    st.score = null;
    this.setState(st);
  },

  // Event callback
  setValue: function (i, value) {
    var st = this.state;
    if (!st.changing) return;
    if (st.score[i] == value) return;
    st.score[i] = value;
    this.setState(st);
  }
});

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

var CurrentLineup = React.createClass({
  render: function () {
    var indices =
      [3, 2, 1,
       4, 5, 0];
    var cells = [];
    var score = this.props.score;
    var players = indices.length;
    for (var i = 0; i < players; ++i) {
      var j = (indices[i] + score) % players;
      cells.push(<div key={j} className="set_lineup_cell">{this.props.initial[j]}</div>);
    }
    return (
      <div className="set_lineup">
        <div className="set_lineup_title">Opstilling</div>
        {cells}
      </div>
      );
  }
});

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
      this.state[k] = v;
      this.setState(state);
    };
    var dataLink = function (k) {
      return {
        value: this.state[k],
        requestChange: updateState.bind(this, k)
      };
    }.bind(this);
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
      </div>
    );
  },
  statics: {
    renderHeader: function () {
      return <div className="modal_header">Udskiftning</div>;
    }
  }
});

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

var ActionList = React.createClass({
  render: function () {
    actions = [].slice.call(this.props.actions);
    actions.reverse();
    actions = actions.map(function (act, i) {
      return <li key={i}>{act.description()}</li>;
    });
    return (
        <div className="actions">
          <ul ref="contents" className="actions_list">
          {actions}
          </ul>

          <TouchButton className="actions_undo" onClick={this.props.onUndo}>
          Slet sidste handling</TouchButton>
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

var Results = React.createClass({
  render: function () {
    var sets = [];
    for (var i = 0; i < SETS; ++i) {
      var set = this.props.sets[i] || {};
      sets.push([(set[0].score | 0) || 0, (set[1].score | 0) || 0]);
    }
    var rows = [];
    for (var i = 0; i < sets.length; ++i) {
      var c0 = (sets[i][0] >= SETSCORE) ? 'results_winner' : '';
      var c1 = (sets[i][1] >= SETSCORE) ? 'results_winner' : '';
      rows.push(
        <tr key={i}>
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
    this.props.onClick(e);
  },
  onTouchStart: function (e) {
    if (e.touches.length != 1) {
      this.setState({touching: false});
      return;
    }
    this.setState({touching: true, identifier: e.touches[0].identifier, target: this.getDOMNode()});
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
        this.setState({touching: false});
      }
    }
  },
  onTouchEnd: function (e) {
    //console.log('end '+e.changedTouches.length+' '+this.changedTouches[0].identifier+' '+e);
    if (this.state.touching
        && e.changedTouches.length == 1
        && e.changedTouches[0].identifier == this.state.identifier)
    {
      this.props.onClick();

      // preventDefault *should* prevent the cascade
      // into mouse events and click event.
      e.preventDefault();
    }
    this.setState({touching: false});
  }
});

React.initializeTouchEvents(true);
React.renderComponent(<MatchForm />, document.body);

window.addEventListener('touchstart', function (e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, false);
