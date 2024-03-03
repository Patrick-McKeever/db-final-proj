import './App.css';
import './all.css';

import React, { Component } from 'react';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import { Chessboard } from 'react-chessboard';
import Chess from 'chess.js';
import ChessGame from './chess_game';
import OutcomeGraph from './outcome_graph';
import GamesList from './games_list';
import MovesTable from './moves_table';

// This is main app component.
// At top level we have two tabs: "Search" and "View game".
// Search lets you view stats about games, statistics,
// and search for games. If you click on a game, it
// directs you to second tab ("View Game"), where you
// can view the game in full. Inside "Search" tab, there
// is a chess board where users can edit positions and
// three tabs to display data: top moves tab, which gives
// top moves from position on board and the percentage
// wins, draws, and losses for each of them; game search
// tab which allows users to search for games by attributes
// as well as the current position; and a tab to see how
// players at different ELO ranges fared in the given
// position, i.e. percent white wins, black wins, and
// draws.
class App extends Component {
	constructor(props) {
		super(props);
		const game = new Chess();
		this.state = {
			// FEN is current position on board.
			fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
			game: game,
			loading: true,
			error: null,
			current_game: null,
			tab: "search"
		};
	}

	componentDidMount() {
		document.title = "Chess DB";
	}

	// This function sanitizes data for API. FEN format
	// has an option third field which contains the SAN str
	// (e.g. e4) of the last move. The third-party board component
	// returns strings in this format, but our dataset on the backend
	// doesn't use it. So, given any FEN str from the board, we replace
	// it's third field with '-' to make it compatible with API format.
	sanitizeFen(raw_fen) {
		let fields = raw_fen.split(' ');
		fields[3] = "-";
		return fields.join(' ');
	}


	// This is callback which is called whenever
	// user moves a piece on chessboard from src
	// square to target square. If this is legal move,
	// we return true (causing board component to render
	// the move); otherwise, false.
	onDrop(src, target) {
		const game_copy = {...this.state.game};
		//let pgn = this.state.game.pgn();
		let pgn="";
		const res = game_copy.move({
			from: src,
			to: target,
			promotion: "q"
		});

		let san_fen = this.sanitizeFen(game_copy.fen());
		this.setState({ game: game_copy, fen: san_fen });

		if(res === null) {
			return false;
		}

		return true;
	}

	// Passed as lambda to child GamesList component,
	// so that it can set the current game in the "View Games"
	// tab (its sibling component) if the user selects a game link
	// within the GamesList.
	SetCurrentGame(game_id) {
		this.setState({ current_game: game_id });
		this.setState({ tab: "game_view" });
	}


	render() {
		const { data, loading, error, move_ind } = this.state;

		return (
			<Tabs selectedTab={this.state.tab}>
				<TabLink to="search">Search</TabLink>
				<TabLink to="game_view">View Game</TabLink>

				<TabContent for="search">
					<div>
						{/* Render your component using the fetched data */}

						<div className="left-side-panel">
							<Chessboard id="board1" boardWidth={560} position={this.state.fen} onPieceDrop={this.onDrop.bind(this)}/>
						</div>
						
						<div className="side-panel">
							<Tabs>
								<TabLink to="top_moves">Top Moves</TabLink>
								<TabLink to="games">Games</TabLink>
								<TabLink to="outcomes">Outcomes by ELO</TabLink>

								<TabContent for="top_moves">
									<MovesTable fen={this.state.fen}/>
								</TabContent>
								<TabContent for="games">
									<GamesList fen={this.state.fen} set_game={this.SetCurrentGame.bind(this)}/>
								</TabContent>
								<TabContent for="outcomes">
									<OutcomeGraph fen={this.state.fen} />
								</TabContent>
							</Tabs>
						</div>

					</div>
				</TabContent>

				<TabContent for="game_view">
					<ChessGame game_id={this.state.current_game}/>
				</TabContent>
			</Tabs>
		);
	}
}

export default App;
