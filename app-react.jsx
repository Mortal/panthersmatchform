/** @jsx React.DOM */
// vim:set ft=javascript sw=2 et:

var SETS = 3;
var SETSCORE = 25;
var TIMEOUTS = 2;
var SUBSTITUTIONS = 6;

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
      ]
    };
  },

  render: function () {
    var addScore = function (teamIndex, points) {
      this.addScore(this.state.currentSetIndex, teamIndex, points);
    }.bind(this);

    return (
    <div className="screen">

    <CurrentSet
      number={this.state.currentSetIndex}
      game={this.state.game}
      set={this.state.sets[this.state.currentSetIndex]}
      matchScore={this.getMatchScore()}
      onAddScore={addScore}
      onTimeoutChange={this.changeTimeout.bind(this, this.state.currentSetIndex)}
      />

    <div className="modal">

      {ActionList.renderHeader()}

      <div className="modal_contents">
        <ActionList />

        <Results game={this.state.game} sets={this.state.sets} />

      </div>

      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0}}>
        <button onClick={this.resetGame}>Start spillet forfra</button>
        <button onClick={this.changeSet.bind(this, -1)}>Forrige sæt</button>
        <button onClick={this.changeSet.bind(this, +1)}>Næste sæt</button>
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

  // Event callback
  addScore: function (setIndex, teamIndex, points) {
    var st = this.state;
    st.sets[setIndex][teamIndex].score += points;
    this.setState(st);
  },

  // Event callback
  changeTimeout: function (setIndex, teamIndex, timeoutData, timeoutIndex) {
    var st = this.state;
    if (timeoutData) {
      // Make a copy
      timeoutData = [].slice.call(timeoutData);
    } else {
      timeoutData = null;
    }
    st.sets[setIndex][teamIndex].timeouts[timeoutIndex] = timeoutData;
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
        timeoutButtons.push(<TouchButton key={i} className={c} onClick={onClick}>T-O</button>);
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
            </button>
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
    return (
        <div className="actions">
          <ul className="actions_list">
          <li>ASV 7 scorer et point.</li>
          <li>Viborg scorer et point.</li>
          <li>ASV 7 kalder en timeout.</li>
          <li>ASV 7 scorer et point.</li>
          <li>Viborg scorer et point.</li>
          <li>ASV 7 udskifter spiller 1 med spiller 23.</li>
          </ul>

          <TouchButton className="actions_undo">Slet sidste handling</TouchButton>
        </div>
    );
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
  getInitialState: function () {
    return {touching: false};
  },
  render: function () {
    var st = {'backgroundColor': this.state.touching ? 'red' : 'yellow'};
    return this.transferPropsTo(
      <button style={st} onClick={this.onClick}
      onTouchStart={this.onTouchStart}
      onTouchMove={this.onTouchMove}
      onTouchEnd={this.onTouchEnd}
      >
      {this.props.children}
      </button>
    );
  },
  onClick: function (e) {
    console.log("Who clicked me?!");
  },
  onTouchStart: function (e) {
    console.log('start '+e.touches.length+' '+this.state.touching);
    if (e.touches.length != 1) {
      this.setState({touching: false});
      return;
    }
    this.setState({touching: true, identifier: e.touches[0].identifier});
    e.preventDefault();
  },
  onTouchMove: function (e) {
    if (this.state.touching
        && e.touches.length == 1
        && e.touches[0].identifier == e.state.identifier)
    {
      e.preventDefault();
    }
  },
  onTouchEnd: function (e) {
    //console.log('end '+e.changedTouches.length+' '+this.changedTouches[0].identifier+' '+e);
    if (this.state.touching
        && e.changedTouches.length == 1
        && e.changedTouches[0].identifier == this.state.identifier)
    {
      console.log('Fire click');
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
