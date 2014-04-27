/** @jsx React.DOM */
// vim:set ft=javascript sw=2 et:

var MatchForm = React.createClass({
  getInitialState: function () {
    return {
      currentSetIndex: 0,
      game: {
        teams: ['ASV 7', 'Viborg']
      },
      sets: [
        {
          score: [15, 10]
        }
      ]
    };
  },
  addScore: function (setIndex, teamIndex, points) {
    var st = this.state;
    st.sets[setIndex].score[teamIndex] += points;
    this.setState(st);
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
      onAddScore={addScore}
      />

    <div className="modal">

      <div className="actions_header">Handlinger</div>

      <div className="modal_contents">
        <ActionList />

        <Results />

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
    var teamRightPlus = function () { this.props.onAddScore(1, 1); }.bind(this);
    var teamRightMinus = function () { this.props.onAddScore(1, -1); }.bind(this);

    return (
      <div className="set">

      <div className="set_header">Sæt {number}</div>

      <TeamSet side="left" teamName={nameLeft} score={set.score[0]}
        onScorePlus={teamLeftPlus} onScoreMinus={teamLeftMinus}
      />
      <TeamSet side="right" teamName={nameRight} score={set.score[1]}
        onScorePlus={teamRightPlus} onScoreMinus={teamRightMinus}
      />

      </div>
      );

  }
});

var TeamSet = React.createClass({
  render: function () {
    return (
    <div className={"set_team team_"+this.props.side}>
      <div className="set_score">
        <div className="set_team_name">{this.props.teamName}</div>
        <button className="set_score_button" onClick={this.props.onScorePlus}>
          <div className="set_score_button_score">{this.props.score}</div>
          <div className="set_score_button_label">+1</div>
        </button>
        <button className="set_score_decrement" onClick={this.props.onScoreMinus}>
          <div className="set_score_decrement_label">&minus;1</div>
        </button>
        <button className="set_score_timeout timeout_1">15-10</button>
        <button className="set_score_timeout timeout_2">T-O</button>
      </div>
      <div className="set_match_score">1</div>

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

      <div className="set_lineup">
        <div className="set_lineup_title">Opstilling</div>
        <div className="set_lineup_cell">23</div>
        <div className="set_lineup_cell">12</div>
        <div className="set_lineup_cell">8</div>
        <div className="set_lineup_cell">7</div>
        <div className="set_lineup_cell">2</div>
        <div className="set_lineup_cell">1</div>
      </div>
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

var Results = React.createClass({
  render: function () {
    return (
        <div className="results">
          <div className="results_header">Resultat</div>

          <table className="results_table" cellSpacing="8">
            <col span="3" width="33%" />
            <tr>
              <th className="results_topleft"></th>
              <th>ASV 7</th>
              <th>Viborg</th>
            </tr>
            <tr>
              <td className="results_set">Sæt 1</td>
              <td className="results_winner">25</td>
              <td>22</td>
            </tr>
            <tr>
              <td className="results_set">Sæt 2</td>
              <td>12</td>
              <td className="results_winner">25</td>
            </tr>
            <tr>
              <td className="results_set">Sæt 3</td>
              <td>15</td>
              <td>10</td>
            </tr>
            <tr className="results_totals">
              <td className="results_set">Bolde i alt</td>
              <td className="results_total">52</td>
              <td className="results_total">57</td>
            </tr>
          </table>

        </div>
    );
  }
});

React.renderComponent(<MatchForm />, document.body);
