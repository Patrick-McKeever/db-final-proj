import React, { Component } from 'react';
import { Chessboard } from 'react-chessboard';
import Chess from 'chess.js';

// This component allows users to search for games
// based on player names, player ELOs, and positions.
// It is essentially a form which sets internal state when
// users modify form values. Not much to explain.
class GameSearch extends Component {
	constructor(props) {
		super(props);
		this.state = {
			white_elo_min: null,
			white_elo_max: null,
			black_elo_min: null,
			black_elo_max: null,
			white_name: null,
			black_name: null,
			result: "Any"
		}
	}

	render() {
		return (
			<div>
				<table>
				<tbody>
				<tr>
					<td>
						White min ELO:
					</td>
					<td>
						<input type="number" value={this.state.white_elo_min}
							onChange={(e) => this.setState({ white_elo_min : e.target.value })}/>
					</td>
					<td>
						White max ELO:
					</td>
					<td>
						<input type="number" value={this.state.white_elo_max}
							onChange={(e) => this.setState({ white_elo_max : e.target.value })}/>
					</td>
				</tr>
				<tr>
					<td>
						Black min ELO:
					</td>
					<td>
						<input type="number" value={this.state.black_elo_min}
							onChange={(e) => this.setState({ black_elo_min : e.target.value })}/>
					</td>
					<td>
						Black max ELO:
					</td>
					<td>
						<input type="number" value={this.state.black_elo_max}
							onChange={(e) => this.setState({ black_elo_max : e.target.value })}/>
					</td>
				</tr>
				<tr>
					<td>
						White name:
					</td>
					<td>
						<input type="text" value={this.state.white_name}
							onChange={(e) => this.setState({ white_name : e.target.value })}/>
					</td>
					<td>
						Black name:
					</td>
					<td>
						<input type="text" value={this.state.black_name}
							onChange={(e) => this.setState({ black_name : e.target.value })}/>
					</td>
					</tr>
				<tr>
					<td>
						Result:
					</td>
					<td>
						<select value={this.state.result} 
							onChange={(e) => this.setState({ result : e.target.value })}>
							<option value="Any">Any</option>
							<option value="1-0">1 - 0</option>
							<option value="0-1">0 - 1</option>
							<option value="1/2-1/2">1/2 - 1/2</option>
						</select>
					</td>
				</tr>
				</tbody>
				</table>
				<button onClick={() => this.props.submit_handler(
											this.state.white_elo_min,
											this.state.white_elo_max,
											this.state.black_elo_min,
											this.state.black_elo_max,
											this.state.white_name,
											this.state.black_name,
											this.state.result)
				}>Submit</button>
			</div>
		);
	}
}

export default GameSearch;
