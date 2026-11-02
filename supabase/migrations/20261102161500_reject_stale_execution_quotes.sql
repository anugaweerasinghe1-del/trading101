-- TradeHQ provider-freshness enforcement.
-- Original history, cash, holdings and legacy market prices are deliberately preserved.
-- These functions already existed as restricted, SECURITY DEFINER private RPC backends.
-- At trade time, never execute on a provider observation older than the
-- supported snapshot window. Fixed simulator quotes remain available only
-- when no provider cache row exists for an instrument.
-- Previous close is valid for a maximum of 7 calendar days (holidays/weekends).
-- The updater rejects old timestamps, even if fetched just now, to avoid
-- laundering old provider prices with a new cache updated_at timestamp.
CREATE OR REPLACE FUNCTION tradehq_private.store_quote(p_asset text, p_price numeric, p_source text, p_observed timestamp with time zone, p_status text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 IF p_price IS NULL OR p_price<=0 OR p_price>=1e9 OR p_price::text IN ('NaN','Infinity','-Infinity')
 OR p_status NOT IN ('provider','realtime','delayed','previous_close') OR p_status IS NULL
 OR p_observed>clock_timestamp()+interval '5 minutes' THEN RETURN false; END IF;
 IF p_observed IS NULL
 OR (p_status = 'previous_close' AND p_observed < clock_timestamp()-interval '7 days')
 OR (p_status <> 'previous_close' AND p_observed < clock_timestamp()-interval '15 minutes')
 THEN RETURN false; END IF;
 INSERT INTO public.market_prices(asset_id,price,source,observed_at,quote_status,updated_at)
 VALUES(p_asset,p_price,p_source,p_observed,p_status,clock_timestamp())
 ON CONFLICT(asset_id) DO UPDATE SET price=excluded.price,source=excluded.source,observed_at=excluded.observed_at,
 quote_status=excluded.quote_status,updated_at=excluded.updated_at
 WHERE market_prices.observed_at IS NULL OR excluded.observed_at>=market_prices.observed_at;
 RETURN FOUND;
END; $function$
;
CREATE OR REPLACE FUNCTION tradehq_private.record_trade(p_asset_id text, p_side text, p_quantity numeric, p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE uid uuid:=auth.uid(); p public.practice_portfolios; a public.practice_assets; q numeric; source text;
 x public.practice_positions; amount numeric; fee numeric; realized numeric:=null; duplicate public.practice_trades;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_request_id IS NULL OR p_side NOT IN ('buy','sell') OR p_side IS NULL OR p_quantity IS NULL OR p_quantity<=0 OR p_quantity>=1e15
  OR p_quantity::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid order'; END IF;
 SELECT * INTO p FROM public.practice_portfolios WHERE user_id=uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Initialize account portfolio first'; END IF;
 SELECT * INTO duplicate FROM public.practice_trades WHERE id=p_request_id;
 IF FOUND THEN
  IF duplicate.user_id<>uid OR duplicate.cycle_id<>p.cycle_id OR duplicate.asset_id<>p_asset_id OR duplicate.side<>p_side OR duplicate.quantity<>p_quantity THEN
   RAISE EXCEPTION 'Order identifier already used'; END IF;
  RETURN jsonb_build_object('portfolio',tradehq_private.portfolio_snapshot(uid),'trade',to_jsonb(duplicate));
 END IF;
 SELECT * INTO a FROM public.practice_assets WHERE asset_id=p_asset_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unsupported asset'; END IF;
 SELECT price,'Cached provider quote: '||m.source INTO q,source FROM public.market_prices m
 WHERE asset_id=p_asset_id
 AND m.observed_at IS NOT NULL
 AND m.observed_at <= clock_timestamp()+interval '1 minute'
 AND m.updated_at <= clock_timestamp()+interval '1 minute'
 AND (
   (m.quote_status='previous_close'
    AND m.observed_at >= clock_timestamp()-interval '7 days'
    AND m.updated_at >= clock_timestamp()-interval '7 days')
   OR (m.quote_status <> 'previous_close'
    AND m.observed_at >= clock_timestamp()-interval '15 minutes'
    AND m.updated_at >= clock_timestamp()-interval '15 minutes')
 );
 IF q IS NULL AND EXISTS(SELECT 1 FROM public.market_prices m WHERE m.asset_id=p_asset_id) THEN
  RAISE EXCEPTION 'Price quote is stale or unavailable for %. Orders are paused until the provider refreshes.',p_asset_id;
 END IF;
 IF q IS NULL THEN q:=a.simulator_price; source:='Fixed simulator price'; END IF;
 amount:=q*p_quantity; fee:=amount*0.001;
 SELECT * INTO x FROM public.practice_positions WHERE user_id=uid AND asset_id=p_asset_id;
 IF p_side='buy' THEN
  IF p.cash<amount+fee THEN RAISE EXCEPTION 'Insufficient funds'; END IF;
  UPDATE public.practice_portfolios SET cash=cash-amount-fee WHERE user_id=uid;
  INSERT INTO public.practice_positions(user_id,asset_id,quantity,avg_price) VALUES(uid,p_asset_id,p_quantity,(amount+fee)/p_quantity)
  ON CONFLICT(user_id,asset_id) DO UPDATE SET avg_price=(practice_positions.avg_price*practice_positions.quantity+amount+fee)/(practice_positions.quantity+p_quantity),quantity=practice_positions.quantity+p_quantity;
 ELSE
  IF x.quantity IS NULL OR x.quantity<p_quantity THEN RAISE EXCEPTION 'Insufficient shares'; END IF;
  realized:=amount-fee-x.avg_price*p_quantity;
  UPDATE public.practice_portfolios SET cash=cash+amount-fee WHERE user_id=uid;
  IF x.quantity=p_quantity THEN DELETE FROM public.practice_positions WHERE user_id=uid AND asset_id=p_asset_id;
  ELSE UPDATE public.practice_positions SET quantity=quantity-p_quantity WHERE user_id=uid AND asset_id=p_asset_id; END IF;
 END IF;
 INSERT INTO public.practice_trades(id,user_id,cycle_id,asset_id,side,quantity,price,fee,total,realized_pnl,price_source)
 VALUES(p_request_id,uid,p.cycle_id,p_asset_id,p_side,p_quantity,q,fee,CASE WHEN p_side='buy' THEN amount+fee ELSE amount-fee END,realized,source);
 UPDATE public.practice_portfolios SET trades_count=trades_count+1,updated_at=now() WHERE user_id=uid;
 PERFORM tradehq_private.refresh_stats(uid);
 RETURN jsonb_build_object('portfolio',tradehq_private.portfolio_snapshot(uid),'trade',(SELECT to_jsonb(t) FROM public.practice_trades t WHERE id=p_request_id));
END; $function$
;
