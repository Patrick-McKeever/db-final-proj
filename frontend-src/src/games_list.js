import React, { Component } from 'react';
import { Chessboard } from 'react-chessboard';
import Chess from 'chess.js';
import GameSearch from './game_search';

// This component consists of a GamesSearch form,
// allowing users to search for games based on attributes,
// and a list of games returned by the search function.
// It is passed a particular FEN which the user has put
// on the application's main board; it will then use
// this to search for games containing that position,
// along with whatever other constraints the user adds.
class GamesList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			// FEN on main board in parent component.
			fen: props.fen,
			// Callback to parent which allows us to edit the
			// "current game" displayed by parent. Allows this
			// component to display a game that the user clicks
			// in the parent div.
			set_parent_game: props.set_game,
			// Stores all the games API has given us.
			games: [],
			loading: true
		}

	}

	componentDidMount() {
		this.GetGames();
	}

	// If parent passed us new FEN, reload data from API.
	componentDidUpdate() {
		if(this.state.fen != this.props.fen) {
			this.setState({ fen: this.props.fen, loading: true }, this.GetGames);
		}
	}

	// Get games according to params set by user in GamesSearch
	// form. If null is passed for any value (or "Any" for results),
	// then that attribute is assumed to be irrelevant for query
	// results (because it is empty in form).
	GetGames(
			white_elo_min = null,
			white_elo_max = null,
			black_elo_min = null,
			black_elo_max = null,
			white_name = null,
			black_name = null,
			result = "Any"
	) {
		// Fetch data from the API
		let url = 'http://127.0.0.1:80/get_games?fen_str=' + this.state.fen;

		if(white_elo_min != null) {
			url += '&wmin=' + String(white_elo_min);
		}
		if(white_elo_max != null) {
			url += '&wmax=' + String(white_elo_max);
		}
		if(black_elo_min != null) {
			url += '&bmin=' + String(black_elo_min);
		}
		if(black_elo_max != null) {
			url += '&bmax=' + String(black_elo_max);
		}
		if(white_name != null) {
			url += '&wname=' + String(white_name);
		}
		if(black_name != null) {
			url += '&bname=' + String(black_name);
		}
		if(result != "Any") {
			url += '&result=' + String(result);
		}

		fetch(url,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
			})
			.then(response => {
				if (!response.ok) {
					console.log(response);
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(data => {
				this.setState({ games: data, loading: false });
			})
			.catch(error => {
				this.setState({ error, loading: false });
			});
	}

	render() {
		if(this.state.loading) {
			return <p>Loading...</p>;
		}

		if(this.state.games.length == 0) {
			return <p>No games from this position</p>;
		}

		return (
			<div>
			<GameSearch submit_handler={this.GetGames.bind(this)}/>
			<table>
				<thead>
				<tr>
					<td>White</td>
					<td>Black</td>
					<td>Date</td>
					<td>Outcome</td>
				</tr>
				</thead>
				<tbody>{
					this.state.games.map(game => {
						return <tr  className={"selectable"}
								key={game["id"]} onClick={() => this.state.set_parent_game(game["id"])}>
							<td>{game["w_player"]} ({game["w_elo"]})</td>
							<td>{game["b_player"]} ({game["b_elo"]})</td>
							<td>{game["date"]}</td>
							<td>{game["outcome"]}</td>
						</tr>
					})
				}</tbody>
			</table>
			</div>
		);
	}
}

export default GamesList;
