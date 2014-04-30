/** @jsx React.DOM */
// vim:set ft=javascript sw=2 et:

var SETS = 3;
var SETSCORE = 25;
var TIMEOUTS = 2;
var SUBSTITUTIONS = 6;

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

function AddScore(st, setIndex, teamIndex, points) {
  this.setIndex = setIndex;
  this.teamIndex = teamIndex;
  this.points = points;
  if (st.sets[setIndex][teamIndex].score === 0) this.points = 0;
  this.teamName = st.game.teams[teamIndex];
  this.teamNames = [st.game.teams[0], st.game.teams[1]];
  var set = st.sets[setIndex];
  this.newScore = [set[0].score, set[1].score];
  this.newScore[teamIndex] += this.points;
}

AddScore.prototype.execute = function (st) {
  var newScore = st.sets[this.setIndex][this.teamIndex].score + this.points;
  st.sets[this.setIndex][this.teamIndex].score = newScore;
};

AddScore.prototype.inverts = function (other) {
  return (this.setIndex == other.setIndex
          && this.teamIndex == other.teamIndex
          && this.points == -other.points);
};

AddScore.prototype.undo = function (st) {
};

AddScore.prototype.description = function () {
  if (this.points == 1) {
    return [<b>{this.teamName}{' scorer!'}</b>,' ',
      this.teamNames[0],' ',this.newScore[0],' - ',this.newScore[1],' ',
        this.teamNames[1]];
  } else if (this.points == -1) {
    return ['Fjern et point fra ',this.teamName];
  } else {
    // This case is never reached
    return ['Tilføj score ', this.points, ' til team ', this.teamIndex,
           ' i sæt ', this.setIndex];
  }
};

function ChangeTimeout(setIndex, teamIndex, timeoutData, timeoutIndex) {
  this.setIndex = setIndex;
  this.teamIndex = teamIndex;
  this.timeoutData = timeoutData;
  this.timeoutIndex = timeoutIndex;
}

ChangeTimeout.prototype.execute = function (st) {
  if (timeoutData) {
    // Make a copy
    timeoutData = [].slice.call(timeoutData);
  } else {
    timeoutData = null;
  }
  st.sets[setIndex][teamIndex].timeouts[timeoutIndex] = timeoutData;
};

ChangeTimeout.prototype.inverts = function (other) {
  return false;
};

ChangeTimeout.prototype.description = function () {
  return ['Skift timeout ', this.timeoutIndex, ' til ', this.timeoutData,
         ' i sæt ', this.setIndex, ' for hold ', this.teamIndex];
};

var MatchForm = React.createClass({
  getInitialState: function () {
    return {
      currentSetIndex: 2,
      game: {
        teams: ['ASV 7', 'Viborg']
      },
      sets: [
        [{score: 25}, {score: 22}],
        [{score: 12}, {score: 25}],
        [{score: 15, subs: [[1, 23]], timeouts: [[15, 10], null],
          lineup: [1, 8, 12, 23, 7, 2]},
        {score: 10, subs: [[23, 12]], timeouts: [null, null],
          lineup: [2, 1, 8, 12, 23, 7]}]
      ],
      actions: []
    };
  },

  pushAction: function (action) {
    var st = this.state;
    st.actions.push(action);
    action.execute(st);
    this.setState(st);
  },

  popAction: function () {
  },

  render: function () {
    var addScore = function (teamIndex, points) {
      this.pushAction(new AddScore(this.state, this.state.currentSetIndex, teamIndex, points));
    }.bind(this);

    var changeTimeout = function (setIndex, teamIndex, timeoutData, timeoutIndex) {
      this.pushAction(new ChangeTimeout(setIndex, teamIndex, timeoutData, timeoutIndex));
    }.bind(this, this.state.currentSetIndex);

    return (
    <div className="screen">

    <CurrentSet
      number={this.state.currentSetIndex}
      game={this.state.game}
      set={this.state.sets[this.state.currentSetIndex]}
      matchScore={this.getMatchScore()}
      onAddScore={addScore}
      onTimeoutChange={changeTimeout}
      />

    <div className="modal">

      {ActionList.renderHeader()}

      <div className="modal_contents">
        <ActionList actions={this.state.actions} />

        <Results game={this.state.game} sets={this.state.sets} />

      </div>

      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0}}>
        <TouchButton onClick={this.resetGame}>Start spillet forfra</TouchButton>
        <TouchButton onClick={this.changeSet.bind(this, -1)}>Forrige sæt</TouchButton>
        <TouchButton onClick={this.changeSet.bind(this, +1)}>Næste sæt</TouchButton>
        <TouchButton onClick={function () {location.reload();}}>Reload</TouchButton>
        <span id="messages" />
      </div>

    </div>
    </div>
    );
  },

  // Event callback
  changeSet: function (delta) {
    var st = this.state;
    st.currentSetIndex += delta;
    this.setState(st);
  },

  // Event callback
  resetGame: function () {
    function emptyTeamSet() { return {score: 0, subs: [], timeouts: [null, null], lineup: [1,2,3,4,5,6]}; }
    function emptySet() { return [emptyTeamSet(), emptyTeamSet()]; }
    this.setState({
      currentSetIndex: 0,
      game: {teams: ['ASV 7', 'Viborg']},
      sets: [
        emptySet(), emptySet(), emptySet()
      ]
    });
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
      var name = game.teams[i];
      var onScorePlus = this.props.onAddScore.bind(this, i, 1);
      var onScoreMinus = this.props.onAddScore.bind(this, i, -1);
      var onTimeoutChange = this.props.onTimeoutChange.bind(this, i);
      var onNewTimeout = this.props.onTimeoutChange.bind(this, i, currentScore);
      teamSets.push(
        <TeamSet key={i} side={sides[i]} teamName={name} set={set[i]}
          matchScore={this.props.matchScore[i]}
          onScorePlus={onScorePlus} onScoreMinus={onScoreMinus}
          onTimeoutChange={onTimeoutChange} onNewTimeout={onNewTimeout}
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

      <Substitutions subs={this.props.set.subs} />

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
              onClick={this.props.onSubstitutionsAdd}>
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

var ActionList = React.createClass({
  render: function () {
    var actions = [].slice.call(this.props.actions.map(function (act, i) {
      return <li key={i}>{act.description()}</li>;
    }));
    actions.reverse();
    return (
        <div className="actions">
          <ul ref="contents" className="actions_list">
          {actions}
          </ul>

          <TouchButton className="actions_undo">Slet sidste handling</TouchButton>
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
  return <div className="actions_header">Handlinger</div>;
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
              <th>{this.props.game.teams[0]}</th>
              <th>{this.props.game.teams[1]}</th>
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
