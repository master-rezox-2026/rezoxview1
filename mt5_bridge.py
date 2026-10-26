"""MT5 bridge for MultiChart Pro.
Serves candles from your open MetaTrader 5 terminal at http://localhost:5000
"""
try:
    import MetaTrader5 as mt5
except Exception:
    mt5 = None
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
from flask import Flask, Response, request, jsonify
from flask_cors import CORS

TF = {} if mt5 is None else {1: mt5.TIMEFRAME_M1, 3: mt5.TIMEFRAME_M3, 5: mt5.TIMEFRAME_M5,
      15: mt5.TIMEFRAME_M15, 30: mt5.TIMEFRAME_M30, 60: mt5.TIMEFRAME_H1,
      120: mt5.TIMEFRAME_H2, 240: mt5.TIMEFRAME_H4, 360: mt5.TIMEFRAME_H6,
      480: mt5.TIMEFRAME_H8, 720: mt5.TIMEFRAME_H12, 1440: mt5.TIMEFRAME_D1,
      10080: mt5.TIMEFRAME_W1}

app = Flask(__name__)
CORS(app)

CRYPTO_APIS = {
    "MEXC": {
        "markets": "https://api.mexc.com/api/v3/ticker/24hr",
        "candles": "https://api.mexc.com/api/v3/klines",
    },
    "KUCOIN": {
        "markets": "https://api.kucoin.com/api/v1/market/allTickers",
        "candles": "https://api.kucoin.com/api/v1/market/candles",
    },
}
KUCOIN_INTERVAL_SECONDS = {
    "1min": 60, "3min": 180, "5min": 300, "15min": 900, "30min": 1800,
    "1hour": 3600, "2hour": 7200, "4hour": 14400, "6hour": 21600,
    "8hour": 28800, "12hour": 43200, "1day": 86400, "1week": 604800,
}


def ensure():
    if mt5 is None:
        raise RuntimeError("MetaTrader5 python package not available (crypto charts still work)")
    if mt5.terminal_info() is None and not mt5.initialize():
        raise RuntimeError("Cannot connect to MT5. Open MetaTrader 5 and log in. %s" % (mt5.last_error(),))


@app.get("/ping")
def ping():
    try:
        ensure()
        return jsonify(ok=True, account=mt5.account_info().login if mt5.account_info() else None)
    except Exception as e:
        return jsonify(ok=False, error=str(e)), 500


@app.get("/symbols")
def symbols():
    try:
        ensure()
        q = request.args.get("q", "").upper()
        return jsonify([s.name for s in (mt5.symbols_get() or []) if q in s.name.upper()][:200])
    except Exception as e:
        return jsonify(error=str(e)), 500


@app.get("/candles")
def candles():
    try:
        ensure()
        sym = request.args["symbol"]
        tf = TF.get(int(request.args.get("tf", 1)))
        count = min(int(request.args.get("count", 1000)), 5000)
        if tf is None:
            return jsonify(error="unsupported timeframe"), 400
        if not mt5.symbol_select(sym, True):
            return jsonify(error="symbol not found: %s (try /symbols?q=%s)" % (sym, sym[:3])), 404
        rates = mt5.copy_rates_from_pos(sym, tf, 0, count)
        if rates is None or len(rates) == 0:
            return jsonify(error="no data for %s" % sym), 404
        return jsonify([{"time": int(r["time"]), "open": float(r["open"]), "high": float(r["high"]),
                         "low": float(r["low"]), "close": float(r["close"]),
                         "volume": float(r["tick_volume"])} for r in rates])
    except Exception as e:
        return jsonify(error=str(e)), 500


ALLOWED_HOSTS = {"api.binance.com", "api.mexc.com", "api.bybit.com", "www.okx.com",
                 "api.gateio.ws", "api.kucoin.com"}


@app.get("/fetch")
def fetch_url():
    url = request.args.get("url", "")
    p = urlparse(url)
    if p.scheme != "https" or p.hostname not in ALLOWED_HOSTS:
        return jsonify(error="host not allowed"), 400
    try:
        req = Request(url, headers={"User-Agent": "MultiChart-Pro/1.0"})
        with urlopen(req, timeout=20) as upstream:
            return Response(upstream.read(), content_type="application/json")
    except HTTPError as e:
        return Response(e.read(), status=e.code, content_type="application/json")
    except (URLError, TimeoutError) as e:
        return jsonify(error="exchange request failed: %s" % e), 502


@app.get("/fx")
def fx_proxy():
    """Free forex/metals candles from Yahoo Finance (works without MT5)."""
    path = request.args.get("path", "")
    if not path.startswith("/v8/finance/chart/") or ".." in path or any(c in path for c in "\\\r\n"):
        return jsonify(error="bad path"), 400
    try:
        req = Request("https://query1.finance.yahoo.com" + path,
                      headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
        with urlopen(req, timeout=15) as upstream:
            return Response(upstream.read(), content_type="application/json")
    except HTTPError as e:
        return Response(e.read(), status=e.code, content_type="application/json")
    except (URLError, TimeoutError) as e:
        return jsonify(error="forex request failed: %s" % e), 502


@app.get("/crypto-proxy")
def crypto_proxy():
    exchange = request.args.get("exchange", "").upper()
    kind = request.args.get("kind", "")
    base = CRYPTO_APIS.get(exchange, {}).get(kind)
    if base is None:
        return jsonify(error="unsupported exchange request"), 400

    params = {}
    if kind == "candles":
        symbol = request.args.get("symbol", "").upper()
        if not symbol or not symbol.replace("-", "").isalnum():
            return jsonify(error="invalid symbol"), 400
        params["symbol"] = symbol
        try:
            limit = max(1, min(int(request.args.get("limit", 1000)), 1000))
        except ValueError:
            return jsonify(error="invalid limit"), 400
        if exchange == "MEXC":
            interval = request.args.get("interval", "")
            if interval not in {"1m", "5m", "15m", "30m", "60m", "4h", "1d", "1W"}:
                return jsonify(error="unsupported MEXC interval"), 400
            params.update(interval=interval, limit=limit)
        else:
            interval = request.args.get("type", "")
            seconds = KUCOIN_INTERVAL_SECONDS.get(interval)
            if seconds is None:
                return jsonify(error="unsupported KuCoin interval"), 400
            end = int(time.time())
            params.update(type=interval, startAt=end - seconds * limit, endAt=end + seconds)

    try:
        req = Request(base + ("?" + urlencode(params) if params else ""),
                      headers={"User-Agent": "MultiChart-Pro/1.0"})
        with urlopen(req, timeout=15) as upstream:
            return Response(upstream.read(), content_type="application/json")
    except HTTPError as e:
        return Response(e.read(), status=e.code, content_type="application/json")
    except (URLError, TimeoutError) as e:
        return jsonify(error="exchange request failed: %s" % e), 502


if __name__ == "__main__":
    print("MT5 bridge running on http://localhost:5000  (keep this window open)")
    app.run(host="127.0.0.1", port=5000, threaded=True)
