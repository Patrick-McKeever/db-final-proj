import React, { Component } from 'react';
import { Chessboard } from 'react-chessboard';
import Chess from 'chess.js';

// This component displays a particular chess game
// identified by an ID prop corresponding to a primary key
// in the GAMES table of the database.
class ChessGame extends Component {
	constructor(props) {
		super(props);
		this.state = {
			data: null,
			game_id: props.game_id,
			// move_ind is current *turn* no, starting at 0.
			// -1 is position before first move.
			// e.g. after 1. e4 e5 2. nf3 nc6 3. bb5 move_ind is 4.
			move_ind: -1,
			loading: true,
			error: null,
			// This is just starting position.
			fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
		};
	}

	componentDidMount() {
		// Fetch data from the API
		this.GetGame();
	}

	// Fetch game data from API.
	// Data is JSON with two fields: "data", which is
	// JSON dict of game metadata attributes,
	// and "moves", which is JSON list of move dictionaries
	// with fields "fen_before" and "san_str",
	// ordered by the order they were played in game.
	GetGame() {
		if(this.state.game_id === null) return;

		fetch('http://127.0.0.1:80/get_game?game_id=' + String(this.state.game_id),
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
				this.setState({ data, loading: false });
			})
			.catch(error => {
				this.setState({ error, loading: false });
			});
	}

	// If we get passed new game ID prop by parent,
	// update internal state.
	componentDidUpdate() {
		if(this.state.game_id != this.props.game_id) {
			this.setState({ game_id: this.props.game_id }, this.GetGame);
		}
	}

	// Increment current move index, but only if it doesn't
	// cause us to go past end of game.
	NextMove = () => {
		let no_moves = this.state.data.moves.length - 1;
		let move_ind = Math.min(this.state.move_ind + 1, no_moves);
		this.GoToMove(move_ind);
	}

	// Decrement current move index, but only if it doesn't
	// bring us before start of game.
	PrevMove = () => {
		// -1 because -1 is just position before first move,
		// and it's valid to revert here.
		this.GoToMove(Math.max(-1, this.state.move_ind - 1));
	}

	// Given index of a move, make board display that particular
	// index.
	GoToMove = (ind) => {
		let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

		if(ind != -1) {
			const pos = new Chess(this.state.data.moves[ind]["fen_before"]);
			pos.move(this.state.data.moves[ind]["san_str"]);
			fen = pos.fen();
		}

		this.setState({ 
			move_ind : ind,
			fen: fen
		});
	}

	render() {
		const { data, loading, error, move_ind } = this.state;

		if(this.state.game_id === null) {
			return <p>Select a game ID in the search tab to view it here</p>;
		}

		if (loading) {
			return <div>Loading...</div>;
		}

		if (error) {
			return <div>Error: {error.message}</div>;
		}

		return (
			<div>
				<div className="side-panel">{
					data.moves.reduce((result, el, ind) => { 
						if(ind % 2 == 0) {
							result.push(<div key={el["turn_no"]}>
								<p className={"selectable"} onClick={this.GoToMove.bind(this, ind)}>
									<span>{el["turn_no"]}.</span>
									<span style = {{
										fontWeight: ind === this.state.move_ind ? "bold" : "normal"
									}}>
										{el["san_str"]}
									</span>
									<span> </span>
									<span style = {{
										fontWeight: (ind + 1) === this.state.move_ind ? "bold" : "normal",
										position: (ind + 1) === this.state.move_ind ? "sticky" : "relative"
									}}>
										{data.moves[ind+1] && data.moves[ind+1]["san_str"]}
									</span>
								</p>
							</div>);
						}
						return result;
					}, [])
				}</div>

				<p>
					<b>{this.state.data.data["w_player"]} ({this.state.data.data["w_elo"]})</b>
					<span> - </span>
					<b>{this.state.data.data["b_player"]} ({this.state.data.data["b_elo"]})</b>
				</p>
				<p><b>{this.state.data.data["outcome"]}</b></p>
				<p><b>{this.state.data.data["event"]}</b></p>
				<p><b>{this.state.data.data["date"]}</b></p>


				<div className="left-side-panel">
					<Chessboard id="board1" boardWidth={560}
								position = {this.state.fen}/>

    				<button className="arrow-button" onClick={this.PrevMove}>
						&lt;-
					</button>

    				<button className="arrow-button" onClick={this.NextMove}>
						-&gt;
    				</button>
				</div>

			</div>
		);
	}
}

export default ChessGame;
