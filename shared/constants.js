// 数値のハードコードを集約するファイル。数値を足す時はここに足す
// コメントには何の指定値かを書く
// エンドポイントURLは各機能のconstants.js(pvpmanager/core, tinv/core)側にある

// ---- 計算機(ゲーム仕様) ----
// アクセサリー枠数の指定値(計算機の入力枠、tinvのequipment切り出し幅に共通)
const ACCESSORY_SLOT_COUNT = 7;               
// menacing指定時に全クラスへ加算するダメージ%の指定値
const MODIFIER_MENACING_DAMAGE = 4;           
// warding指定時に加算する防御力の指定値
const MODIFIER_WARDING_DEFENSE = 4;           
// sake有効時に加算する防御力の指定値(負数)
const SAKE_DEFENSE_MODIFIER = -4;             
// sake有効時に加算する近接ダメージ%の指定値
const SAKE_MELEE_BONUS = 10;                  
// ポーションCT短縮効果の短縮率%の指定値(表示用)
const POTION_COOLDOWN_REDUCTION_PERCENT = 25; 

// ---- API取得 ----
// {endpoint}/all/0/{limit} のlimit部分の指定値(全件取得できる大きさ)
const API_FETCH_LIMIT = 10000;                
// 1回の通信(レスポンス本文の読み込みまで)を打ち切るまでの時間(ms)の指定値
const FETCH_TIMEOUT_MS = 15000;               

// ---- tinv(メンバータブ) ----
// tinvのitems.equipment配列内の添字の指定値(accessoryStartからACCESSORY_SLOT_COUNT枠がアクセサリー)
const TINV_EQUIPMENT_INDEX = { head: 0, body: 1, legs: 2, accessoryStart: 3 };
// HP/MP/hotbar一覧の更新間隔(ms)の指定値
const MEMBER_STATS_INTERVAL_MS = 5000;        
// 防具/アクセサリーの更新間隔(ms)の指定値
const MEMBER_EQUIPMENT_INTERVAL_MS = 3000;    
// 一覧取得がこの回数連続で失敗したらAPI Dead表示にする指定値
const MEMBER_STATS_MAX_FAILURES = 5;          
// 装備取得が全員分この回数連続で失敗したらAPI died扱いにする指定値
const MEMBER_EQUIPMENT_MAX_FAILURES = 4;      
