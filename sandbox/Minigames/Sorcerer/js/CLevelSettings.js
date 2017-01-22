function CLevelSettings(){
    
    var _aBallSpeed;
    var _aBallNumber;
    var _aBallColors;
    var _aHeroPos;
    var _aCurveLevel;
    
    this._init = function(){
        this._initBallSpeed();
        this._initBallNumber();
        this._initBallColors();
        this._initHeroPos();
        this._initCurveLevel();
    };
    
    this._initBallSpeed = function(){
        _aBallSpeed = new Array();
       
        //LEVEL 1
        _aBallSpeed[0] = 50;
        
        //LEVEL 2
        _aBallSpeed[1] = 40;
        
        //LEVEL 3
        _aBallSpeed[2] = 30;
       
    };
    
    this._initBallNumber = function(){
        _aBallNumber = new Array();
        
        //LEVEL 1
        _aBallNumber[0] = 60;
        
        //LEVEL 2
        _aBallNumber[1] = 80;
        
        //LEVEL 3
        _aBallNumber[2] = 100;
    };
    
    this._initBallColors = function(){
        _aBallColors = new Array();
        _aBallColors[0] = BALL_COLORS - 1;
        _aBallColors[1] = BALL_COLORS;
        _aBallColors[2] = BALL_COLORS;
    };
    
    this._initHeroPos = function(){
        _aHeroPos = new Array();
        
        //LEVEL 1
        _aHeroPos[0] = new createjs.Point(500,400);
        
        //LEVEL 2
        _aHeroPos[1] = new createjs.Point(500,400);
        
        //LEVEL 3
        _aHeroPos[2] = new createjs.Point(500,400);
    };
    
    this._initCurveLevel = function(){
        _aCurveLevel = new Array();
        
        //LEVEL 1
		  
		_aCurveLevel[0] = [ [-102,262],[-42,226],[120,154],[168,136],[215,120],[264,104],[313,92],[363,83]
							,[414,76],[464,71],[516,68],[566,66],[617,66],[668,71],[718,84],[765,100],[810,125],[851,154]
							,[891,188],[923,226],[950,269],[967,317],[969,368],[948,413],[902,433],[855,417],[825,375],[805,329],[781,284]
							,[755,240],[719,204],[676,178],[628,158],[578,151],[528,151],[477,159],[428,169],[378,179],[328,192],[280,208],[233,227]
							,[187,250],[145,278],[105,309],[75,350],[57,397],[51,447],[56,498],[68,548],[91,593],[122,634],[163,663],[210,681],[260,690],[311,694]
							,[359,697],[419,698],[479,698],[529,696],[579,692],[632,685],[687,674],[737,661],[787,643],[827,625],[872,598],[897,565],[897,523]
							,[867,495],[829,477],[789,477],[749,492],[717,514],[679,541],[634,571],[592,592],[552,605],[512,613],[469,615],[422,612],[379,604]
							,[339,593],[296,576],[254,551],[224,519],[205,476]];  
		
        //LEVEL 2
        _aCurveLevel[1] = [ [378,-39],[498,3],[618,51],[670,74],[720,97],[768,122],
                            [810,147],[853,175],[890,204],[935,245],[971,290],
                            [992,328],[999,369],[990,410],[967,448],[936,483],
                            [898,515],[856,545],[806,575],[763,597],[718,618],
                            [663,640],[615,656],[558,673],[505,686],[440,697],
                            [373,704],[298,701],[240,691],[189,671],[142,636],
                            [105,591],[83,544],[68,497],[60,444],[59,382],
                            [65,329],[76,282],[93,234],[119,187],[149,148],
                            [184,120],[224,100],[272,92],[319,95],[366,101],
                            [409,110],[482,128],[552,149],[609,169],[707,212],[776,250],
                            [840,297],[872,347],[865,386],[842,423],[802,458],[754,491],
                            [709,515],[606,555],[529,577],[456,591],[379,593],
                            [339,585],[299,557],[276,517],[264,475],[259,422],
                            [264,365],[273,320],[291,272],[318,235],[348,217],
                            [383,216],[428,223],[487,240],[555,265],[632,298]];
                       
        _aCurveLevel[2] = [ [-49,228],[22,181],[81,150],[181,113],[253,95],[343,78],[421,71],[476,71],
                            [542,72],[593,76],[651,85],[703,97],[758,114],[811,136],[863,166],[903,200],
                            [933,237],[954,277],[970,325],[978,375],[962,472],[900,550],
                            [845,586],[803,611],[758,631],[710,646],[664,657],[619,665],[567,670],[519,672],
                            [467,671],[410,667],[363,660],[315,651],[265,637],[218,620],[175,598],[122,561],
                            [82,513],[58,468],[47,418],[46,370],[59,330],[96,304],[137,310],[164,346],
                            [160,389],[169,431],[193,476],[226,509],[263,535],[323,560],
                            [401,577],[473,584],[546,584],[616,579],[689,564],[744,540],
                            [796,503],[829,461],[849,413],[854,371],[839,331],[802,311],
                            [759,318],[741,358],[736,401],[714,439],[677,468],[634,486],
                            [587,497],[540,501],[475,501],[420,493],[372,480],[327,456],[293,423],[274,378],[272,338]];
    };
    
    this.getBallSpeedForLevel = function(iLevel){
        return _aBallSpeed[iLevel-1];
    };
    
    this.getBallNumberForLevel = function(iLevel){
        return _aBallNumber[iLevel-1];
    };
    
    this.getBallColorsForLevel = function(iLevel){
        return _aBallColors[iLevel-1];
    };
    
    this.getHeroPosForLevel = function(iLevel){
        return _aHeroPos[iLevel-1];
    };
    
    this.getCurveForLevel = function(iLevel){
        return _aCurveLevel[iLevel-1];
    };
    
    this.getNumLevels = function(){
        return _aCurveLevel.length;
    };
    
    this._init();
}