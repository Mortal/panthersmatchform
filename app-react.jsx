/** @jsx React.DOM */
// vim:set ft=javascript sw=2 et:

var SETS = 3;
var SETSCORE = 25;
var TIMEOUTS = 2;

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
        [{score: 15, subs: [[1, 23]], timeouts: [[15, 10]],
          lineup: [1, 8, 12, 23, 7, 2]},
        {score: 10, subs: [[23, 12]], timeouts: [],
          lineup: [2, 1, 8, 12, 23, 7]}]
      ]
    };
  },
  addScore: function (setIndex, teamIndex, points) {
    var st = this.state;
    st.sets[setIndex][teamIndex].score += points;
    this.setState(st);
  },
  changeTimeout: function (setIndex, teamIndex, timeoutIndex, s1, s2) {
    var st = this.state;
    st.sets[setIndex][teamIndex].timeouts[timeoutIndex] = [s1, s2];
    this.setState(st);
  },
  getMatchScore: function () {
    var setsWon = [0,0];
    for (var i = 0; i <= this.state.currentSetIndex; ++i) {
      var set = this.state.sets[i];
      if (set[0].score >= SETSCORE) setsWon[0]++;
      if (set[1].score >= SETSCORE) setsWon[1]++;
    }
    return setsWon;
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

    </div>
    </div>
    );
  }
});

var CurrentSet = React.createClass({
  render: function () {
    var number = this.props.number + 1;
    var set = this.props.set;
    var game = this.props.game;
    var nameLeft = game.teams[0];
    var nameRight = game.teams[1];

    var teamLeftPlus = function () { this.props.onAddScore(0, 1); }.bind(this);
    var teamLeftMinus = function () { this.props.onAddScore(0, -1); }.bind(this);
    var teamLeftTimeoutChange = this.props.onTimeoutChange.bind(this, 0);
    var teamRightPlus = function () { this.props.onAddScore(1, 1); }.bind(this);
    var teamRightMinus = function () { this.props.onAddScore(1, -1); }.bind(this);
    var teamRightTimeoutChange = this.props.onTimeoutChange.bind(this, 1);

    return (
      <div className="set">

      <div className="set_header">Sæt {number}</div>

      <TeamSet side="left" teamName={nameLeft} set={set[0]}
        matchScore={this.props.matchScore[0]}
        onScorePlus={teamLeftPlus} onScoreMinus={teamLeftMinus}
        onTimeoutChange={teamLeftTimeoutChange}
      />
      <TeamSet side="right" teamName={nameRight} set={set[1]}
        matchScore={this.props.matchScore[1]}
        onScorePlus={teamRightPlus} onScoreMinus={teamRightMinus}
        onTimeoutChange={teamRightTimeoutChange}
      />

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
      if (i < timeouts.length) {
        var onChange = function (i, s1, s2) {
          this.props.onTimeoutChange(i, s1, s2);
        }.bind(this, i);
        timeoutButtons.push(<TimeoutButton className={c} score={timeouts[i]} onChange={onChange} />);
      } else {
        timeoutButtons.push(<button className={c} onClick={this.props.onNewTimeout}>T-O</button>);
      }
    }
    return (
    <div className={"set_team team_"+this.props.side}>
      <div className="set_score">
        <div className="set_team_name">{this.props.teamName}</div>
        <button className="set_score_button" onClick={this.props.onScorePlus}>
          <div className="set_score_button_score">{score}</div>
          <div className="set_score_button_label">+1</div>
        </button>
        <button className="set_score_decrement" onClick={this.props.onScoreMinus}>
          <div className="set_score_decrement_label">&minus;1</div>
        </button>
        {timeoutButtons}
      </div>
      <div className="set_match_score">{this.props.matchScore}</div>

      <div className="set_substitutions">
        <div className="set_substitutions_title">Udskiftninger</div>
        <div className="set_substitutions_cell">
          <div className="set_substitutions_cell_in">1</div>
          <div className="set_substitutions_cell_in_label">Ind</div>
          <div className="set_substitutions_cell_out">23</div>
          <div className="set_substitutions_cell_out_label">Ud</div>
        </div>
        <div className="set_substitutions_cell">
          <button className="set_substitutions_cell_add">+</button>
        </div>
        <div className="set_substitutions_cell"></div>
        <div className="set_substitutions_cell"></div>
        <div className="set_substitutions_cell"></div>
        <div className="set_substitutions_cell"></div>
      </div>

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
      return <button className={this.props.className} onClick={this.startChange}>{score[0]}-{score[1]}</button>;
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
  startChange: function () {
    var st = this.state;
    st.changing = true;
    st.score = [this.props.score[0], this.props.score[1]];
    this.setState(st);
  },
  stopChange: function () {
    var st = this.state;
    this.props.onChange(st.score[0], st.score[1]);
    st.changing = false;
    st.score = null;
    this.setState(st);
  },
  setValue: function (i, value) {
    var st = this.state;
    if (!st.changing) return;
    if (st.score[i] == value) return;
    st.score[i] = value;
    this.setState(st);
  }
});

var Scroller = React.createClass({
  scrollTo: function (value) {
    var elt = this.getDOMNode();
    if (!elt) return false;
    var idx = value - this.props.min;
    var c = elt.childNodes[idx];
    if (!c) return false;
    elt.scrollTop = c.offsetTop + c.offsetHeight / 2 - elt.offsetHeight / 2;
    return true;
  },
  componentDidMount: function () {
    this.scrollTo(this.props.value);
  },
  render: function () {
    var values = [];
    for (var i = this.props.min; i <= this.props.max; ++i) {
      var c = (i == this.props.value) ? 'scroller_value scroller_selected' : 'scroller_value';
      values.push(<div className={c}>{i}</div>);
    }
    return <div onWheel={this.onWheel} onScroll={this.onScroll} className='scroller'>{values}</div>;
  },
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
      console.log(selectedIndex + this.props.min);
      this.props.onChange(selectedIndex + this.props.min);
    }
  }
});

var CurrentLineup = React.createClass({
  render: function () {
    var indices =
      [0, 5, 4,
       1, 2, 3];
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

          <button className="actions_undo">Slet sidste handling</button>
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
        <tr>
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

React.renderComponent(<MatchForm />, document.body);
