# This database application does not support much in way of insertion or deletion.
# Its aim is to store static data and allow easy analysis.
# For this reason, all tests consist of testing API endpoints against pre-stored data.
# I iterated through the PGN files of pgnmentor.com (from which I built the DB) in order
# to find all records matching certain test conditions. I then test the database's return
# values against these test conditions. If they return something different, then clearly
# the API has some error.
import urllib.request
import sys
import json

if __name__ == "__main__":
    BASE_URL = "https://chess-db.patrick-mckeever.xyz/"
    if len(sys.argv) >= 2:
        BASE_URL = sys.argv[1]
        
        
    def get_games(fen_str, wname=None, bname=None, wmin=None, wmax=None, bmin=None, bmax=None, result=None):
        url = BASE_URL + "/get_games.php?fen_str=" + fen_str
        if wname is not None:
            url += "&wname=" + wname
        if bname is not None:
            url += "&bname=" + bname
        if wmin is not None:
            url += "&wmin=" + wmin
        if wmax is not None:
            url += "&wmax=" + wmax
        if bmin is not None:
            url += "&bmin=" + bmin
        if bmax is not None:
            url += "&bmax=" + bmax
        if result is not None:
            url += "&result=" + result
    
        with urllib.request.urlopen(url) as data_str:
            data = json.load(data_str)
            for el in data:
                del el["id"]
            return data
    
    # Load test data from JSON file
    with open('test_data.json') as json_file:
        test_data = json.load(json_file)
    
    # Just search for all Morphy-Anderssen games from King's Gambit.
    # Test to see if the endpoint returns all of them.
    morphy_anderson_kg = get_games(**test_data['morphy_anderson_kg'])
    assert(morphy_anderson_kg == test_data['morphy_anderson_kg_expected'])
    
    print("'get_games' endpoint passed all tests")
    
    
    # Find top responses for 1. e4, 1. d4, 1. c4, compare against data recorded from PGNs.
    def get_top_moves(fen_str):
        url = BASE_URL + "/get_moves.php?fen_str=" + fen_str
        with urllib.request.urlopen(url) as data_str:
            data = json.load(data_str)
            return data
    
    e4_top_moves = get_top_moves(**test_data['e4_top_moves'])
    assert(e4_top_moves == test_data['e4_top_moves_expected'])
    
    d4_top_moves = get_top_moves(**test_data['d4_top_moves'])
    assert(d4_top_moves == test_data['d4_top_moves_expected'])
    
    c4_top_moves = get_top_moves(**test_data['c4_top_moves'])
    assert(c4_top_moves == test_data['c4_top_moves_expected'])
    
    print("'get_moves' endpoint passed all tests")
    
    
    # Find ELO outcome distribution for 1. e4, 1. d4, 1. c4, compare against data recorded from PGNs.
    def get_outcomes_by_elo_range(fen_str):
        url = BASE_URL + "/get_outcomes_by_elo.php?fen_str=" + fen_str
        with urllib.request.urlopen(url) as data_str:
            data = json.load(data_str)
            return data
    
    e4_elor_outcomes = get_outcomes_by_elo_range(**test_data['e4_elor_outcomes'])
    assert(e4_elor_outcomes == test_data['e4_elor_outcomes_expected'])
    
    d4_elor_outcomes = get_outcomes_by_elo_range(**test_data['d4_elor_outcomes'])
    assert(d4_elor_outcomes == test_data['d4_elor_outcomes_expected'])
    
    c4_elor_outcomes = get_outcomes_by_elo_range(**test_data['c4_elor_outcomes'])
    assert(c4_elor_outcomes == test_data['c4_elor_outcomes_expected'])
    
    print("'get_outcomes_by_elo' endpoint passed all tests")
    
    print("PASSED ALL TESTS")
