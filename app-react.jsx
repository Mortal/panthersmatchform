/** @jsx React.DOM */
// vim:set ft=javascript sw=2 et:

var MatchForm = React.createClass({
  render: function () {
    return (
    <div className="screen">

    <div className="set">

    <div className="set_header">Sæt 3</div>

    <div className="set_team team_left">
      <div className="set_score">
        <div className="set_team_name">ASV 7</div>
        <button className="set_score_button">
          <div className="set_score_button_score">15</div>
          <div className="set_score_button_label">+1</div>
        </button>
        <button className="set_score_decrement">
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

    <div className="set_team team_right">
      <div className="set_score">
        <div className="set_team_name">Viborg</div>
        <button className="set_score_button">
          <div className="set_score_button_score">10</div>
          <div className="set_score_button_label">+1</div>
        </button>
        <button className="set_score_decrement">
          <div className="set_score_decrement_label">&minus;1</div>
        </button>
        <button className="set_score_timeout timeout_1">T-O</button>
        <button className="set_score_timeout timeout_2">T-O</button>
      </div>
      <div className="set_match_score">1</div>
      <div className="set_substitutions">
        <div className="set_substitutions_title">Udskiftninger</div>
        <div className="set_substitutions_cell">
          <div className="set_substitutions_cell_in">23</div>
          <div className="set_substitutions_cell_in_label">Ind</div>
          <div className="set_substitutions_cell_out">12</div>
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
    </div>

    <div className="modal">

      <div className="actions_header">Handlinger</div>

      <div className="modal_contents">
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

      </div>

    </div>
    </div>
    );
  }
})

React.renderComponent(<MatchForm />, document.body);
