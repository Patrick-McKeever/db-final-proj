import glob, os
import sqlite3
import chess.pgn

con = sqlite3.connect("chess_games.db")
cur = con.cursor()
cur.execute("""CREATE TABLE IF NOT EXISTS PLAYERS(
				player_id INTEGER PRIMARY KEY,
				name VARCHAR(80)
			);""")
cur.execute("""CREATE TABLE IF NOT EXISTS EVENTS(
				event_id INTEGER PRIMARY KEY,
				name VARCHAR(100)
			);""")
cur.execute("""CREATE TABLE IF NOT EXISTS GAMES(
				game_id INTEGER PRIMARY KEY,
				white_player_id INTEGER,
				black_player_id INTEGER,
				event_id INTEGER,
				outcome VARCHAR(10),
				date VARCHAR(20),
				FOREIGN KEY(white_player_id) REFERENCES PLAYERS(player_id),
				FOREIGN KEY(black_player_id) REFERENCES PLAYERS(player_id),
				FOREIGN KEY(event_id) REFERENCES EVENTS(event_id)
			);""")
cur.execute("""CREATE TABLE IF NOT EXISTS MOVES(
				game_id INTEGER,
				turn_no INTEGER,
				white_to_move INTEGER,
				san_str VARCHAR(10),
				fen_before VARCHAR(100),
				fen_after VARCHAR(100),
				PRIMARY KEY(game_id, turn_no, white_to_move)
			);""")
cur.execute("""CREATE TABLE IF NOT EXISTS RATINGS(
				game_id INTEGER,
				player_id INTEGER,
				elo INTEGER,
				PRIMARY KEY(game_id, player_id),
				FOREIGN KEY(game_id) REFERENCES GAMES(game_id),
				FOREIGN KEY(player_id) REFERENCES PLAYERS(player_id)
			);""")

PLAYER_IDs = {}
EVENT_IDs = {}

def get_player_id(cur, player):
	if player in PLAYER_IDs:
		return PLAYER_IDs[player]

	cur.execute("SELECT player_id FROM PLAYERS WHERE name=?", (player,))
	if res := cur.fetchone():
		return res[0]
	return None

def insert_player(cur, name):
	cur.execute("INSERT INTO PLAYERS(player_id, name) VALUES(NULL, ?)", (name,))
	PLAYER_IDs[name] = cur.lastrowid
	return PLAYER_IDs[name]

def get_event_id(cur, name):
	if name in EVENT_IDs:
		return EVENT_IDs[name]

	cur.execute("SELECT event_id FROM EVENTS WHERE name=?", (name,))
	if res := cur.fetchone():
		return res[0]
	return None

def insert_event(cur, name):
	cur.execute("INSERT INTO EVENTS(event_id, name) VALUES(NULL, ?)", (name,))
	EVENT_IDs[name] = cur.lastrowid
	return EVENT_IDs[name]

def insert_moves(cur, game, game_id):
	board = game.board()
	for move in game.mainline_moves():
		turn_no = board.fullmove_number
		white_to_move = board.turn
		fen_before = board.fen()
		san_move = board.san(move)
		board.push(move)
		fen_after = board.fen()

		cur.execute("""INSERT INTO MOVES(
							game_id,
							turn_no,
							white_to_move,
							san_str,
							fen_before,
							fen_after)
						VALUES(?, ?, ?, ?, ?, ?)""",
					(game_id, turn_no, white_to_move, 
					san_move, fen_before, fen_after))

def insert_elo(cur, game, player, elo):
	cur.execute("""INSERT INTO RATINGS(
					game_id,
					player_id,
					elo)
				VALUES(?, ?, ?);""",
				(game, player, elo,))
	

def insert_game(cur, game):
	white_player = get_player_id(cur, game.headers["White"])
	if white_player is None:
		white_player = insert_player(cur, game.headers["White"])

	black_player = get_player_id(cur, game.headers["Black"])
	if black_player is None:
		black_player = insert_player(cur, game.headers["Black"])

	event = get_event_id(cur, game.headers["Event"])
	if event is None:
		event = insert_event(cur, game.headers["Event"])
	
	
	outcome = game.headers["Result"]
	date = game.headers["Date"]
	cur.execute("""INSERT INTO GAMES(
					game_id, white_player_id, black_player_id, 
					event_id, outcome, date)
					VALUES(NULL, ?, ?, ?, ?, ?)""",
				(white_player, black_player, event, outcome, date,))

	game_id = cur.lastrowid
	insert_moves(cur, game, game_id)
	insert_elo(cur, game_id, white_player, game.headers["WhiteElo"])
	insert_elo(cur, game_id, black_player, game.headers["BlackElo"])

	return cur.lastrowid

		

for file in glob.glob("pgns/*.pgn"):
	with open(file, "r") as pgn:
		print("File", file)
		while True:
			try:
				game = chess.pgn.read_game(pgn)
				if game is None:
					break

				if (game.headers["White"] == "?" or game.headers["Black"] == "?"
					or game.headers["Event"] == "?"):
						continue
				#print(game.headers)
				game_id = insert_game(cur, game)
			except:
				continue
		
		con.commit()

cur.close()
con.close()
