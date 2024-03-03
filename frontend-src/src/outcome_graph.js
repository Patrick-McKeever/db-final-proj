import React, { Component } from 'react';
import { Chessboard } from 'react-chessboard';
import Chess from 'chess.js';
import { VictoryStack, VictoryLegend, VictoryBar, VictoryAxis, VictoryChart } from 'victory';

// This table exists to give a graphical representation of
// game outcomes for a particular position as they vary across
// ELO ranges. Given a position on the application's main board,
// this component will ask the API what percentage of games from
// that position concluded with a white win, a black win, or a draw
// at ELO ranges of 200 (i.e. 2000-2199, 2200-2399, etc.). It will
// then display this data using a stacked bar chart.
class OutcomeGraph extends Component {
	constructor(props) {
		super(props);
		this.state = {
			// FEN on app borad.
			fen: props.fen,
			loading: true,
			outcomes: []
		}

	}

	componentDidMount() {
		this.GetOutcomes();
	}

	// If parent gives us new FEN, reload data from API.
	componentDidUpdate() {
		if(this.state.fen != this.props.fen) {
			this.setState({ fen: this.props.fen, loading: true }, this.GetOutcomes);
		}
	}

	// Data returned from API is JSON list with entry
	// for each 200-range of ELO values. Each list entry
	// has fields "elor" for min bound of range; "wwins",
	// "bwins", and "draws" for no. white wins, black wins,
	// draws in games in that ELO range; and "occs" for
	// total no. of time this position has occurred at that
	// ELO range.
	GetOutcomes() {
		// Fetch data from the API
		fetch('http://127.0.0.1:80/get_outcomes_by_elo?fen_str=' + this.state.fen,
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
				this.setState({ outcomes: data, loading: false });
			})
			.catch(error => {
				this.setState({ error, loading: false });
			});
	}


	render() {
		if(this.state.loading) {
			return <p>Loading...</p>;
		}

		if(this.state.outcomes.length == 0) {
			return <p>No games from this position</p>;
		}

		// We use victory for a stacked bar chart.
		return (<div>
					<VictoryChart domainPadding={10} padding={{ top: 5, bottom: 50, left: 50, right: 50 }} width={300} height={250}>
						<VictoryAxis 
							label="ELO range"
							tickValues={this.state.outcomes.map((el) => {
								return el["elor"]
							})}
							style={{
								tickLabels: { fontSize: 10, padding: 5, angle: -45, textAnchor: 'end' }
							}}
						/>
						<VictoryAxis 
							dependentAxis
							label="Percentage Outcome"
							tickValues={[0.25, 0.50, 0.75, 1]}
							style={{
								tickLabels: { fontSize: 10, padding: 5, angle: -45, textAnchor: 'end' }
							}}
						/>
						<VictoryStack colorScale={["#baffc9", "#bae1ff", "#ffb3ba"]}>
							<VictoryBar key={"wwin"} data={
								this.state.outcomes.map(el => { return { x : String(el["elor"]), y : el["wwin"] / el["occs"] }; })
							}/>
							<VictoryBar key={"draw"} data={
								this.state.outcomes.map(el => { return { x : String(el["elor"]), y : el["draw"] / el["occs"] }; })
							}/>
							<VictoryBar key={"bwin"} data={
								this.state.outcomes.map(el => { return { x : String(el["elor"]), y : el["bwin"] / el["occs"] }; })
							}/>
						</VictoryStack>
					</VictoryChart>


					<VictoryLegend data={[
						{ name: 'White Wins', symbol: { fill: "#baffc9" } },
						{ name: 'Draw', symbol: { fill: "#bae1ff" } },
						{ name: 'Black Wins', symbol: { fill: "#ffb3ba" } },
						]}
						orientation="horizontal"
						gutter={10}
						style={{ 
							title: { fontSize: 11 },
							labels: { lineHeight: 2, padding: 5 },
							parent: { display: 'flex', justifyContent: 'center' },
						}}/>
				</div>);
	}
}

export default OutcomeGraph;
