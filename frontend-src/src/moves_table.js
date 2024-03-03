import React, { Component } from 'react';
import { Chessboard } from 'react-chessboard';
import Chess from 'chess.js';

// This component shows the top moves (limited to 10)
// that are played in a given position (taken from the application's
// main board) as well as the number of times those moves occurred,
// and the percentage white wins, black wins, and draws that took
// place when each move was played.
class MovesTable extends Component {
	constructor(props) {
		super(props);
		this.state = {
			// FEN on main board.
			fen: props.fen,
			top_moves: [],
			loading: true
		}

	}

	componentDidMount() {
		this.GetTopMoves();
	}

	// If parent passes us new FEN, update data from API.
	componentDidUpdate() {
		if(this.state.fen != this.props.fen) {
			this.setState({ fen: this.props.fen, loading: true }, this.GetTopMoves);
		}
	}


	// API returns JSON list. Each entry has fields
	// "san_str" (e.g. e4); "wwins" for no. white wins;
	// "bwins" for no. black wins; "draws" for no. draws;
	// and "occs" for number of total times that move
	// was played in the given position.
	GetTopMoves() {
		// Fetch data from the API
		fetch('http://127.0.0.1:80/get_moves?fen_str=' + this.state.fen,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin':'*'
				},
				credentials: 'include',
			})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(data => {
				this.setState({ top_moves: data, loading: false });	
			})
			.catch(error => {
				this.setState({ error, loading: false });
			});
	}


	render() {
		if(this.state.loading) {
			return <p>Loading...</p>;
		}

		if(this.state.top_moves.length == 0) {
			return <p>No games from this position</p>;
		}

		return (<table>
					<thead>
					<tr>
						<td>Move</td>
						<td>Occurrences</td>
						<td>White Wins</td>
						<td>Black Wins</td>
						<td>Draws</td>
					</tr>
					</thead>
					<tbody>{
						this.state.top_moves.map(move => {
							return <tr>
								<td>{move["san_str"]}</td>
								<td>{move["occurrences"]}</td>
								<td>{Math.round((move["wwin"]  * 100) / move["occurrences"])}%</td>
								<td>{Math.round((move["bwin"]  * 100) / move["occurrences"])}%</td>
								<td>{Math.round((move["draws"] * 100) / move["occurrences"])}%</td>
							</tr>
						})
					}</tbody>
				</table>);
	}
}

export default MovesTable;
