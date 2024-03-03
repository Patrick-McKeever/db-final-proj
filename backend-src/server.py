from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection parameters
db_params = {
    'dbname': 'database1',
    'user': 'postgres',
    'password': 'chessdatabase',
    'host': 'database-1.czgcqoqm8v6n.us-east-2.rds.amazonaws.com',
    'port': '5432'
}

db_state = {}

# When app boots, set up DB connection.
# When it closes, close it down.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to PostgreSQL database
    db_state["con"] = psycopg2.connect(**db_params)
    db_state["con"].set_session(autocommit=True)
    db_state["cur"] = db_state["con"].cursor(cursor_factory=RealDictCursor)
    yield
    db_state["cur"].close()
    db_state["con"].close()

app = FastAPI(lifespan=lifespan)

# Configure CORS
# This assumes you're running client on 127.0.0.1
# (as the compose.yaml does).
origins = ["http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all HTTP headers
)

# Given game_id (PK of GAMES table), return game metadata as
# JSON dict under key "data" and game moves (in order, 
# list of tuples of fields "san_str" and "fen_before")
# under "moves" key.
@app.get("/get_game")
async def get_game(game_id: int):
    res = {}
    cur = db_state["cur"]

    cur.execute('''SELECT outcome, w.name AS w_player, b.name AS b_player,
                    EVENTS.name AS event, GAMES.date AS date,
                    rw.elo AS w_elo, rb.elo AS b_elo
                    FROM MOVES
                    JOIN GAMES ON MOVES.game_id = GAMES.game_id
                    JOIN EVENTS ON EVENTS.event_id = GAMES.event_id
                    JOIN PLAYERS w ON white_player_id=w.player_id 
                    JOIN PLAYERS b ON black_player_id=b.player_id 
                    JOIN RATINGS rw ON white_player_id=rw.player_id 
                        AND GAMES.game_id=rw.game_id
                    JOIN RATINGS rb ON black_player_id=rb.player_id 
                        AND rb.game_id = GAMES.game_id
                    WHERE GAMES.game_id = %s;''',
                    (game_id,))
    res["data"] = cur.fetchone()

    cur.execute('''SELECT * FROM MOVES WHERE game_id = %s 
                    ORDER BY turn_no, white_to_move DESC;''',
                    (game_id,))
    res["moves"] = cur.fetchall()

    return res


# Given white/black min/max ELOs, white/black player names, and
# position, return list of dictionaries of game metadata for all
# games containing that position obeying constraints set by
# query params. If param is left blank (i.e. passed as None),
# then user doesn't care about that field.
@app.get("/get_games")
async def get_games(fen_str : str, 
					wmin : int = None, wmax : int = None, bmin : int = None, bmax: int = None,
					wname : str = None, bname : str = None, result : str = None):
	cur = db_state["cur"]
	query_str = '''SELECT DISTINCT GAMES.game_id as id, GAMES.date as date,
					outcome, w.name as w_player, b.name as b_player,
					rw.elo as w_elo, rb.elo as b_elo, 
					(rw.elo + rb.elo) as combined_elo
					FROM MOVES JOIN GAMES
					ON MOVES.game_id = GAMES.game_id
    				JOIN PLAYERS w on white_player_id=w.player_id 
    				JOIN PLAYERS b on black_player_id=b.player_id 
    				JOIN RATINGS rw on white_player_id=rw.player_id 
					AND GAMES.game_id=rw.game_id
    				JOIN RATINGS rb on black_player_id=rb.player_id 
					AND rb.game_id = GAMES.game_id
					WHERE fen_before=%s '''
	query_params = [fen_str]

	if wmin is not None:
		query_str += 'AND rw.elo > %s '
		query_params.append(wmin)
	if wmax is not None:
		query_str += 'AND rw.elo < %s '
		query_params.append(wmax)
	if bmin is not None:
		query_str += 'AND rb.elo > %s '
		query_params.append(bmin)
	if bmax is not None:
		query_str += 'AND rb.elo < %s '
		query_params.append(bmax)
	if wname is not None:
		query_str += 'AND w.name like %s '
		query_params.append("%" + wname + "%")
	if bname is not None:
		query_str += 'AND b.name like %s '
		query_params.append("%" + bname + "%")
	if result is not None:
		query_str += 'AND GAMES.outcome like %s '
		query_params.append(result)
	
	query_str += 'ORDER BY (rw.elo + rb.elo) DESC '
	query_str += 'LIMIT 10;'

	cur.execute(query_str, query_params)
	return cur.fetchall()
	


# Given a fen string, get top [limit] moves that are played
# in response. I.e. Once position is on the board, what are the
# most likely responses? Also return outcomes (what percent of
# games in which response was played were won by white, black,
# or drawn?). Returned format is list of moves with fields
# "fen_before", "san_str", "occs" (no. of times this response
# was played in given position [fen_str] in dataset), "wwins"
# (no. times white won after playing that move), "bwins", and
# "draws".
@app.get("/get_moves")
async def get_moves(fen_str : str, lim : int = 10):
	cur = db_state["cur"]
	#cur.execute("""SELECT * FROM MOVES;""")
	#return cur.fetchone()
	cur.execute("""SELECT san_str, COUNT(*) as occurrences, 
					COUNT(CASE WHEN GAMES.outcome='1-0' THEN 1 END) as wwin, 
					COUNT(CASE WHEN GAMES.outcome='0-1' THEN 1 END) as bwin, 
					COUNT(CASE WHEN GAMES.outcome='1/2-1/2' THEN 1 END) as draws 
					FROM MOVES JOIN GAMES ON MOVES.game_id=GAMES.game_id
					WHERE fen_before=%s AND NOT outcome='*'
					GROUP BY san_str ORDER BY count(*) DESC
					LIMIT %s;""",
					(fen_str, lim,))
	return cur.fetchall()
	
# For each range of 200 ELO of players (e.g. 2000-2199, 2200-2399, etc.),
# represented as "elor" key, return no occurrences ("occs"), white wins ("wwin"),
# black wins ("bwin"), and draws ("draw") from a given positon ("fen_str",
# query param).
@app.get("/get_outcomes_by_elo")
async def get_outcomes_by_elo(fen_str : str):
	cur = db_state["cur"]

	# FLOOR(w.elo / 200) * 200 divides white ELO into
	# ranges of 200; i.e. all ELOs between 2000 and 2199
	# are grouped into this.
	# Note that we only care about games where *both*
	# players are in this range. This is why we can
	# use w.elo in this formula, since we also check that
	# black ELO is between FLOOR(w.elo / 200) * 200 and
	# FLOOR(w.elo / 200) * 200 + 200.
	cur.execute("""SELECT (FLOOR(w.elo / 200) * 200) as elor,
    				COUNT(*) as occs,
    				COUNT(CASE WHEN outcome='1-0' THEN 1 END) as wwin,
    				COUNT(CASE WHEN outcome='0-1' THEN 1 END) as bwin,
    				COUNT(CASE WHEN outcome='1/2-1/2' THEN 1 END) as draw
    				FROM MOVES
    				JOIN GAMES ON MOVES.game_id = GAMES.game_id
    				JOIN RATINGS W ON white_player_id=w.player_id 
					AND GAMES.game_id=w.game_id
    				JOIN RATINGS B ON black_player_id=b.player_id 
					AND b.game_id = GAMES.game_id
    				AND NOT outcome='*'
					AND b.elo > (FLOOR(w.elo / 200) * 200)
					AND b.elo < (FLOOR(w.elo / 200) * 200) + 200
    				WHERE fen_before=%s
					GROUP BY (FLOOR(w.elo / 200) * 200)
					ORDER BY (FLOOR(w.elo / 200) * 200) DESC, occs DESC;""",
					(fen_str,))
	return cur.fetchall()

