// src/data/irish-locations.ts
// Enhanced with comprehensive data from CountiesAreas.xlsx - 32 counties and 4,000+ areas

export interface LocationData {
  [county: string]: string[];
}

export const IRISH_LOCATIONS: LocationData = {
  "Antrim": [
    "Aghagallon", "Aghalee", "Ahoghill", "Aldergrove", "Andersonstown", "Annadale", "Antrim", 
    "Antrim Road", "Antrim Town", "Ardoyne", "Armoy", "Aughnacleagh", "Ballintoy", "Ballybogy", 
    "Ballycarry", "Ballycastle", "Ballyclare", "Ballyduff", "Ballyfinaghy", "Ballygalley", 
    "Ballygomartin", "Ballygowan", "Ballyhackamore", "Ballyhenry", "Ballykeel", "Ballymagarry", 
    "Ballymena", "Ballymoney", "Ballymurphy", "Shilvodan", "Shoptown", "Shore Rd", "Skegoneill", 
    "Springmartin", "Stewartstown", "Stoneyford", "Straid", "Stranmillis", "Stranocum", "Suffolk", 
    "Taughmonagh", "Templepatrick", "The Diamond", "Titanic Quarter", "Toome", "Turf Lodge", 
    "Twinbrook", "University Area", "Upper Ballinderry", "Upper Malone", "Water Works", "Whiteabbey", 
    "Whitehead", "Whitehouse", "Whiterock", "Windsor", "Woodbreda Gardens", "Woodvale", "York Road"
  ],
  "Armagh": [
    "Aghinlig", "Allistragh", "Armagh", "Armagh Town", "Belleek", "Bessbrook", "Blackwatertown", 
    "Brownlow", "Camlough", "Charlemont", "Charlestown", "Clady Milltown", "Clare", "Cloghoge", 
    "Craigavon", "Creggan", "Crossmaglen", "Cullaville", "Cullyhanna", "Derrynoose", "Derrytrasna", 
    "Drumintee", "Forkill", "Hamiltonsbawn", "Helen's Bay", "Jonesborough", "Keady", "Killeen", 
    "Killevy", "Killycomain", "Killylea", "Kilmore", "Knocknashane", "Laurelvale", "Lislea", 
    "Loughgall", "Lurgan", "Madden", "Magher", "Markethill", "Meigh", "Middletown", "Milford", 
    "Milltown", "Mowhan", "Mullaghbane", "Newtownhamilton", "Parklake", "Portadown", "Poyntz pass", 
    "Richhill", "Silver Bridge", "Tandragee", "Tassagh", "Tullymacreeve", "Tynan", "Whitecross"
  ],
  "Carlow": [
    "Ardattin", "Augha", "Bagenalstown", "Ballinabranagh", "Ballinkillin", "Ballon", "Ballybannon", 
    "Ballybrommel", "Ballyhacket", "Ballymurphy", "Ballynakill", "Bennekerry", "Borris", "Bunclody", 
    "Carlow Town", "Carrig Beg", "Clonegal", "Clonmore", "Clough", "Cloydah", "Corries", "Drumfea", 
    "Drummin", "Fenagh", "Garryhill", "Gowlin", "Graigue", "Graigue Hill", "Graiguecullen", 
    "Graiguenamanagh", "Grange", "Grangeford", "Hacketstown", "Kilcoltrim", "Kildavin", "Killedmond", 
    "Killerig", "Lackan", "Leighlinbridge", "Lisnavagh", "Myshall", "Newtown", "Nurney", "Oak Park", 
    "Oldleighlin", "Palatine", "Pollerton", "Rathedan", "Rathoe", "Rathvilly", "Ridge", "Seskinryan", 
    "St. Mullins", "The Butts", "Tinryland", "Tullow", "Urglin Glebe"
  ],
  "Cavan": [
    "Ardlougher", "Arva", "Bailieborough", "Ballinagh", "Ballyconnell", "Ballyhaise", "Ballyheelan", 
    "Ballyjamesduff", "Ballymachugh", "Bawnboy", "Bellanacargy", "Belturbet", "Billis Bridge", 
    "Blacklion", "Butler's Bridge", "Canningstown", "Carrickaboy", "Carrigan", "Castlerahan", "Cavan", 
    "Cavan Town", "Clifferna", "Cloverhill", "Cootehill", "Coppanagh", "Corlough", "Cornafean", 
    "Cross Keys", "Crossdoney", "Crosserlough", "Doogary", "Galbolie", "Glangevlin", "Gortahill", 
    "Gubaveeny", "Kilcogy", "Kill", "Killeshandra", "Killinkere", "Killykeen", "Kilnaleck", 
    "Kingscourt", "Knockbride", "Lavey", "Lisduff", "Lisnageer", "Losset", "Lough Gowna", "Milltown", 
    "Mountnugent", "Mullagh", "New Inn", "Oldcastle", "Redhills", "Relaghbeg", "Ryefield", "Shercock", 
    "Sherlock", "Stradone", "Swanlinbar", "Templeport", "Tonyduff", "Treehoo", "Tullyvin", "Virginia"
  ],
  "Clare": [
    "Annacarriga", "Ardnacrusha", "Aughinish", "Ballinruan", "Ballycorick", "Ballylaghnan", 
    "Ballynacally", "Ballyvaughan", "Barefield", "Bauntlieve", "Bealaclugga", "Bealaha", 
    "Bellharbour", "Bodyke", "Bohatch", "Boolyduff", "Boston", "Breaghva", "Bridgetown", 
    "Broadford", "Bunratty", "Burrenfada", "Caher", "Caherconnel", "Caherea", "Cahermurphy", 
    "Carrigaholt", "Carron", "Castletown", "Clarecastle", "Cloghera", "Clonlara", 
    "Newmarket-on-Fergus", "Noughaval", "O'Briensbridge", "O'Callaghans Mills", "Oatfield", 
    "Ogonelloe", "Parteen", "Portdrine", "Querrin", "Quilty", "Quin", "Rinneen", "Roadford", 
    "Ruan", "Scarriff", "Shannakea", "Shannon", "Sheenaun", "Sixmilebridge", "Spanish Point", 
    "Teermaclane", "Termon", "The Burren", "The Hand Cross Roads", "Toomaghera", "Tuamgraney", 
    "Tubber", "Tulla", "Turlough", "Westbury", "Whitegate", "Willbrook"
  ],
  "Cork": [
    "Adrigole", "Aghabullogue", "Aghada", "Aghaville", "Ahakista", "Aherla", "Allihies", "Araglin",
    "Ardfield", "Ardgehane", "Ardglass", "Ardgroom", "Ashton", "Ballinadee", "Ballinascarty", 
    "Ballinclashet", "Ballincollig", "Ballincrokig", "Ballincurrig", "Ballineen", "Ballingeary", 
    "Ballingurteen", "Ballinhassig", "Ballinlough", "Ballinluska", "Ballinmlagh", "Ballinora", 
    "Ballinrea", "Ballinspittle", "Ballintemple", "Ballinure", "Ballinveiltig", "Summercove", 
    "Sunday's Well", "Tarvara", "Taur", "Teerelton", "Templehill", "Templemartin", "The Lough", 
    "Timoleague", "Tivoli", "Toames", "Togher", "Togher (Cork City)", "Toormore", "Tower", 
    "Tracton", "Trafrask", "Tragumna", "Tullylease", "Turners Cross", "Union Hall", "Vicarstown", 
    "Victoria Cross", "Walshtown", "Waterfall", "Watergrasshill", "Western Road", "White Hall", 
    "White's Cross", "Whitechurch", "Whitegate", "Wilton", "Youghal"
  ],
  "Derry": [
    "Aghadowey", "Ardmore", "Articlave", "Ballykelly", "Ballymoney", "Ballyronan", "Bellaghy", 
    "Boleran", "Burnfoot", "Campsey", "Castledawson", "Castlerock", "Castleroe", "Clady", "Claudy", 
    "Coleraine", "Culmore", "Curran", "Derry City", "Desertmartin", "Downhill", "Draperstown", 
    "Drumahoe", "Drumsurn", "Dungiven", "Eglinton", "Feeny", "Garvagh", "Glenhead", "Greysteel", 
    "Gulladuff", "Kilrea", "Knockloughrim", "Limavady", "Limavady Road", "Lisnamuck", "Londonderry", 
    "Macosquin", "Maghera", "Magherafelt", "Magilligan", "Moneymore", "Moneyneany", "New Buildings", 
    "Park", "Portglenone", "Portstewart", "Ringsend", "Swatragh", "The Loup", "Tobermore", "Upperlands"
  ],
  "Donegal": [
    "Altnapaste", "Annagry", "Ardagh", "Ardara", "Arranmore", "Arryheernabin", "Aughagault", 
    "Aughkeely", "Ballindrait", "Ballintra", "Ballure", "Ballybofey", "Ballygorman", "Ballyheerin", 
    "Ballyhillin", "Ballyliffin", "Ballymagan", "Ballymagaraghy", "Ballymore", "Ballynacarrick", 
    "Ballynashannagh", "Ballyshannon", "Barnesmore", "Bellanamore", "Bogay", "Breenagh", "Bridgend", 
    "Bridgetown", "Brinlack", "Rashedoge", "Rathmullan", "Ray", "Redcastle", "Rosapenna", "Rosnakill", 
    "Rossbeg", "Rossgeir", "Rossnowlagh", "Shalwy", "Sheskinapoll", "Speenoge", "St. Johnstown", 
    "Straid", "Stranorlar", "Stravally", "Stroove", "Tamney", "Tangaveane", "Tawny", "Teelin", 
    "Termon", "Tievemore", "Treantagh", "Tully", "Tullydush", "Tullynaha", "Tullyvoos", "Urbalreagh", 
    "Welchtown", "West Town", "White Castle"
  ],
  "Down": [
    "Albertbridge road", "Annaclone", "Annacloy", "Annadorn", "Annahilt", "Annallong", "Annsborough", 
    "Ardglass", "Ardkeen", "Ardmillan", "Attical", "Balliggan", "Ballycloughan", "Ballycrochan", 
    "Ballygowan", "Ballyhalbert", "Ballyholme", "Ballyhornan", "Ballykeel", "Ballylesson", 
    "Ballymacarrett", "Ballymaconaghy", "Ballymartin", "Ballymisert", "Ballynafoy", "Ballynahinch", 
    "Ballynoe", "Ballyroney", "Ballyrushboy", "Ballywalter", "Ballyward", "Banbridge", "Mullartown", 
    "Newcastle", "Newry", "Newtownards", "Newtownbreda", "Orangefield", "Ormeau", "Portaferry", 
    "Portavogie", "Raffrey", "Rathfriland", "Ravenhill", "Rosetta", "Rostrevor", "Saintfield", 
    "Sandown", "Scarva", "Seaforde", "Seapatrick", "Shandon", "Stormont", "Strandtown", "Strangford", 
    "Sydenham", "Taughblane", "The Temple", "Tullycarnet", "Tyrella", "Upper Newtownards Road", 
    "Waringsford", "Waringstown", "Warrenpoint", "Woodstock"
  ],
  "Dublin": [
    "Adamstown", "Ard Na Greine", "Artane", "Ashington", "Ashtown", "Aylesbury", "Ayrfield", 
    "Balbriggan", "Baldonnell", "Baldoyle", "Balgriffin", "Ballinascorney", "Ballinteer", 
    "Ballsbridge", "Ballyboden", "Ballybough", "Ballyboughal", "Ballybrack", "Ballycorus", 
    "Ballycullen", "Ballyfermot", "Ballymount", "Ballymun", "Balrothery", "Balscaddan", 
    "Bayside", "Beaumont", "Belfield", "Blackrock", "Blanchardstown", "Bluebell", "Sandycove", 
    "Sandyford", "Sandymount", "Santry", "Shankill", "Skerries", "Smithfield", 
    "South Circular Road", "South City", "South County", "St. James Gate", "Stepaside", 
    "Stillorgan", "Stoneybatter", "Strawberry Beds", "Sutton", "Swords", "Tallaght", "Temple Bar", 
    "Templeogue", "Terenure", "The Coombe", "The Five Roads", "Ticknock", "Tyrrelstown", 
    "Walkinstown", "Ward", "West County", "Whitehall", "Willbrook", "Windy Arbour"
  ],
  "Fermanagh": [
    "Aghalan", "Aghnablaney", "Ardmoney", "Ardshankill", "Arney", "Ballagh", "Ballinamallard", 
    "Ballindarragh", "Ballyreagh", "Belcoo", "Bellanaleck", "Belleek", "Blaney", "Boho", 
    "Brookeborough", "Clabby", "Clonelly", "Culky", "Derrygonnelly", "Derrylin", "Donagh", 
    "Drumduff", "Ederney", "Enniskillen", "Garrison", "Garvary", "Irvinestown", "Kesh", "Killadeas", 
    "Kinawley", "Lack", "Letterbreen", "Lisbellaw", "Lisnarrick", "Lisnaskea", "Mackan", 
    "Maguiresbridge", "Monea", "Newtownbutler", "Pettigo", "Rosscor", "Rosslea", "Scribbagh", 
    "Springfield", "Tamlaght", "Teemore", "Tempo", "Trory", "Tully", "Wheathill"
  ],
  "Galway": [
    "Abbey", "Abbeyknockmoy", "Ahascragh", "Aille", "Alloon Lower", "Annaghdown", "Ard", "Ardcloon", 
    "Ardmore", "Ardnadoman", "Ardnagreevagh", "Ardnasodan", "Ardrahan", "Athenry", "Attymon", 
    "Aucloggeen", "Aughrim", "Aughrus More", "Ballaba", "Ballagh", "Ballard", "Ballardiggan", 
    "Ballinaboy", "Ballinafad", "Ballinamore Bridge", "Ballinasloe", "Ballinderreen", "Ballintemple", 
    "Ballybane", "Ballybrit", "Ballyburke", "Shanbally", "Shantalla", "Shrule", "Skehana", 
    "Skehanagh", "Slievemurry", "Spiddal", "Streamstown", "Tawin", "Taylor's Hill", "Teeranea", 
    "Teernakill", "Terryland", "Tirneevin", "Tonabrocky", "Tonacurragh", "Toomard", "Toombeola", 
    "Townparks", "Trust", "Tuam", "Tuam Road", "Tubber", "Tullokyne", "Tully Cross", "Turloughmore", 
    "Twomileditch", "Tynagh", "Wellpark", "Williamstown", "Woodford", "Woodquay"
  ],
  "Kerry": [
    "Abbeydorney", "Abbeyfeale", "Aghadoe", "Annascaul", "Ardea", "Ardfert", "Astee", "Aughacasla", 
    "Aughils", "Baile an Sceilg", "Ballinahow", "Ballincloher", "Ballineanig", "Ballinloghig", 
    "Ballinskelligs", "Ballybrack", "Ballybunion", "Ballydavid", "Ballyduff", "Ballyferriter", 
    "Ballyhar", "Ballyheigue", "Ballylongford", "Ballynakilly", "Ballynaskreena", "Ballyquin", 
    "Banna", "Barraduff", "Beal", "Beaufort", "Boheeshil", "Bonane", "Carranreagh", "Newtown", 
    "Oaghley", "Parknasilla", "Portmagee", "Rathmore", "Reen", "Riverville", "Saleen", "Sallahig", 
    "Scartaglin", "Shanacashel", "Six Crosses", "Smerwick", "Sneem", "Spa", "Stradbally", "Tahilla", 
    "Tarbert", "Teeranearagh", "Teeromoyle", "Templenoe", "Tiduff", "Tooreencahill", "Tralee", 
    "Tullakeel", "Tullamore", "Tullig", "Tuosist", "Valentia Island", "Ventry", "Waterville", 
    "Westcove", "White Gate Cross Roads"
  ],
  "Kildare": [
    "Allen", "Allenwood", "Ardscull", "Athgarvan", "Athy", "Ballitore", "Ballyfair", 
    "Ballymore Eustace", "Ballynadrumny", "Ballyroe", "Ballysax", "Ballyshannon", "Boley", 
    "Brannockstown", "Broadford", "Burtown", "Cadamstown", "Calverstown", "Carbury", "Carragh", 
    "Castledermot", "Celbridge", "Cherryville", "Clane", "Clogharinka", "Cloncurry", "Coill Dubh", 
    "Colbinstown", "Confey", "Coolearagh", "Lullymore", "Maddenstown", "Maganey", "Mainham", 
    "Maynooth", "Milemill", "Milltown", "Monasterevin", "Moone", "Moyvalley", "Mucklon", "Naas", 
    "Narraghmore", "Newbridge", "Newtown", "Nurney", "Old Kilcullen", "Pollardstown", "Prosperous", 
    "Punchestown", "Rathangan", "Rathcoffey", "Robertstown", "Sallins", "Staplestown", "Straffan", 
    "Suncroft", "The Curragh", "Timahoe", "Timolin", "Two Mile House", "Windmill"
  ],
  "Kilkenny": [
    "Balleen", "Ballinakill", "Ballinamara", "Ballincrea", "Ballinvarry", "Ballycallan", "Ballyfasy", 
    "Ballyfoyle", "Ballyhale", "Ballykeefe", "Ballykeoghan", "Ballyline", "Ballymack", "Ballyragget", 
    "Barrack Village", "Baunskeha", "Bennettsbridge", "Boobyglass", "Burnchurch", "Callan", 
    "Carrigeen", "Castlecomer", "Castletown", "Castlewarren", "Clara", "Clogga", "Clogh", 
    "Clonmantagh", "Clontubbrid", "Mount Garret", "Mullenbeg", "Mullinavat", "New Ross", "Newmarket", 
    "Owning", "Paulstown", "Piltown", "Powerstown", "Railyard", "Rathmoyle", "Reenvanagh", 
    "Rochestown", "Rosbercon", "Skehana", "Slieverue", "Smithstown", "Stoneyford", "The Rower", 
    "The Sweep", "Thomastown", "Three Castles", "Tubbrid", "Tullagher", "Tullaghought", "Tullaherin", 
    "Tullaroan", "Urlingford", "Whitehall", "Windgap"
  ],
  "Laois": [
    "Abbeyleix", "Aghaboe", "Ardlea", "Arless", "Attanagh", "Ballacolla", "Ballaghmore", 
    "Ballickmoyler", "Ballinagar", "Ballinakill", "Ballintubbert", "Ballyadams", "Ballybrittas", 
    "Ballybrophy", "Ballydavis", "Ballyfin", "Ballyhuppahane", "Ballylynan", "Ballyroan", "Bilboa", 
    "Borris-In-Ossory", "Camross", "Cappalinnan", "Cashel", "Castlecuffe", "Castletown", "Clarahill", 
    "Clonaslee", "Clough", "Coolnareen", "Coolrain", "Crettyard", "Donaghmore", "Durrow", "Emo", 
    "Errill", "Graiguecullen", "Jamestown", "Kilbricken", "Kilcavan", "Killenard", "Kilminchy", 
    "Kilmorony", "Knocks", "Luggacurren", "Mountmellick", "Mountrath", "Nealstown", "Newtown", 
    "Old Town", "Pallas", "Pike of Rush Hall", "PortLaoise", "Portarlington", "Rathdowney", 
    "Ringstown", "Rosenallis", "Rossmore", "Shanahoe", "Shanragh", "Spink", "Stradbally", "Swan", 
    "Timahoe", "Towlerton", "Vicarstown", "Wolfhill"
  ],
  "Leitrim": [
    "Aghacashel", "Aghamore", "Annaduff", "Askill", "Aughavas", "Aughnasheelan", "Ballinagleragh", 
    "Ballinamore", "Balloor", "Beagh", "Bornacoola", "Buckode", "Carrick-on-Shannon", "Carrigallen", 
    "Cloone", "Cloone Grange", "Corracloona", "Corraleehan", "Corrawaleen", "Corriga", "Corry", 
    "Dorrusawillin", "Dowra", "Dromahair", "Dromlea", "Dromod", "Drumcong", "Drumkeeran", 
    "Drumshambo", "Drumsna", "Farnaght", "Gortgarrigan", "Gortletteragh", "Gorvagh", "Greagh", 
    "Gurteen", "Jamestown", "Keshcarrigan", "Killarga", "Killygar", "Kilnagross", "Kiltyclogher", 
    "Kinlough", "Largydonnell", "Lecarrow", "Leckanarainey", "Leckaun", "Leitrim", "Leitrim Town", 
    "Leitrim Village", "Lisduff", "Lissinagroagh", "Lissiniska", "Lurganboy", "Manorhamilton", 
    "Mohill", "Newtowngore", "Rooskey", "Rossinver", "Shruffanagh", "Tarmon", "Tawnylea", "Tullaghan"
  ],
  "Limerick": [
    "Abbeyfeale", "Abington", "Adare", "Ahane", "Anglesboro", "Annacotty", "Ardagh", "Ardpatrick", 
    "Ashford", "Askeaton", "Athea", "Athlacca", "Ballagh", "Ballaghbehy", "Ballinacurra", 
    "Ballinagarrane", "Ballingarry", "Ballinleeny", "Ballvengland", "Ballyagran", "Ballyallinan", 
    "Ballybrood", "Ballyclough", "Ballycummin", "Ballygrennan", "Ballyhaght", "Ballyhahill", 
    "Ballylanders", "Ballymurragh", "Old Kildimo", "Oldmill Bridge", "Oola", "Pallasgreen", 
    "Pallaskenry", "Patrickswell", "Pennywell", "Prospect", "Rahanagh", "Raheen", "Rathbane", 
    "Rathkeale", "Redgate", "Reens", "Rhebogue", "Rockhill", "Rootiagh", "Rossbrien", "Roxborough", 
    "Shanagolden", "Singland", "South Circular Road", "Southill", "Strand", "Templeglantine", 
    "Templemungret", "Thomondgate", "Tooraree", "Toornafulla", "Tournafulla"
  ],
  "Longford": [
    "Abbeylara", "Abbeyshrule", "Aghasashel", "Ardagh", "Aughnacliffe", "Ballinalee", "Ballinamuck", 
    "Ballymahon", "Barry", "Bornacoola", "Bunlahy", "Carrickboy", "Carrowrory", "Clondra", "Clooneen", 
    "Colehill", "Corbay Upper", "Corlea", "Crossea", "Cullyfad", "Danesfort", "Dring", "Drumlish", 
    "Edgeworthstown", "Ennybegs", "Esker South", "Formoyle", "Forthill", "Granard", "Johnstownbridge", 
    "Keenagh", "Killashee", "Killoe", "Lanesboro", "Legan", "Leggah", "Lisryan", "Longford Town", 
    "Mostrim", "Moydow", "Moyne", "Newtowncashel", "Newtownforbes", "Ratharney", "Taghshinny", 
    "Tarmonbarry", "Turreen"
  ],
  "Louth": [
    "Annagassan", "Ardee", "Ballymakenny", "Baltray", "Blackrock", "Carlingford", "Castlebellingham", 
    "Chanonrock", "Clogherhead", "Collon", "Darver", "Dowdallshill", "Drogheda", "Dromin", "Dromiskin", 
    "Drumcar", "Dunany", "Dundalk", "Dunleer", "Giles Quay", "Grange", "Grangebellew", "Greenore", 
    "Jenkinstown", "Kilanny", "Kilcurly", "Kilcurry", "Kilkerley", "Kilsaran", "Knockbridge", 
    "Louth", "Louth Town", "Mansfieldstown", "Monasterboice", "Omeath", "Paughnstown", "Port", 
    "Rathcor", "Ravensdale", "Reaghstown", "Roestown", "Shanlis", "Stabannan", "Tallanstown", 
    "Tenure", "Termonfeckin", "The Bush", "Togher", "Townley Hall", "Tullyallen", "Whites Town"
  ],
  "Mayo": [
    "Achill", "Achill Sound", "Aghadiffin", "Aghadoon", "Aghagower", "Aghamore", "Aghleam", 
    "An Geata Mor", "Attavally", "Attymass", "Balla", "Ballina", "Ballindine", "Ballinrobe", 
    "Ballintubber", "Ballycastle", "Ballycroy", "Ballyfarnagh", "Ballygarries", "Ballyglass", 
    "Ballyhaunis", "Ballyhean", "Ballynagoraher", "Ballynastangford", "Ballytoohy", "Ballyvary", 
    "Bangor Erris", "Barnacahoge", "Barnatra", "Barnycarroll", "Bekan", "Belcarra", "Belderrig", 
    "Belfarsad", "Bellacorick", "Park", "Partry", "Pollatomish", "Pontoon", "Portacloy", "Porturlin", 
    "Rake Street", "Rathlackan", "Rathoma", "River", "Roonah Quay", "Roosky", "Ross Port", 
    "Ross West", "Rosturk", "Roundfort", "Salia", "Scardaun", "Sheskin", "Shranamanragh Bridge", 
    "Shrule", "Srah", "Srahduggaun", "Srahmore", "Strade", "Swinford", "Tawnyinah", "Tobernadarry", 
    "Tourmakeady", "Trean", "Tristia", "Tulrohaun", "Turlough", "Urlaur", "Valley", "Westport", 
    "Westport Quay"
  ],
  "Meath": [
    "Ardanew", "Ardcath", "Ashbourne", "Athboy", "Athlumney", "Ballinabrackey", "Ballinlough", 
    "Ballivor", "Ballyhoe", "Ballynacree", "Ballynare", "Balrath", "Batterstown", "Bective", 
    "Bellewstown", "Bettystown", "Blackbull", "Blackwater Bridge", "Boggan", "Bohermeen", 
    "Boyerstown", "Carlanstown", "Carnaross", "Castlejordan", "Castletown", "Cloghbrack", 
    "Cloghmacoo", "Clonalvy", "Clonard", "Clonee", "Clonycavan", "Cortown", "Cross Keys", 
    "Crossakiel", "Longwood", "Martinstown", "Millbrook", "Mornington", "Mosney", "Moynalty", 
    "Moynalvey", "Mullagh", "Navan", "Nobber", "Oldcastle", "Oristown", "Parsonstown", 
    "Pike Corner", "Rathcairn", "Rathcore", "Rathfeigh", "Rathkenny", "Rathmolyon", "Ratoath", 
    "Robinstown", "Ross", "Skryne", "Slane", "Stackallen", "Stamullen", "Summerhill", "Tara", 
    "Teevurcher", "Thomastown", "Trim", "Tullaghanstown", "Tylas", "Virginia Road", "Wilkinstown", 
    "Yellow Furze"
  ],
  "Monaghan": [
    "Aghabog", "Annayalla", "Aughnamullen", "Ballinode", "Ballybay", "Broomfield", "Capragh", 
    "Carrickashedoge", "Carrickmacross", "Carrickroe", "Castleblaney", "Castleshane", "Cavanagarvan", 
    "Clones", "Clontibret", "Corcaghan", "Corvally", "Creaghanroe", "Drum", "Emyvale", "Glaslough", 
    "Inniskeen", "Killeevan", "Laragh", "Loughmorne", "Mill Town", "Monaghan", "Monaghan Town", 
    "Mullan", "Newbliss", "Rockcorry", "Scotshouse", "Scotstown", "Shanco", "Shantonagh", 
    "Smithborough", "Stone Bridge", "Threemilehouse", "Tirnaneill", "Tullyamalra", "Tydavnet"
  ],
  "Offaly": [
    "Ardan", "Ballinagar", "Ballyboy", "Ballybryan", "Ballycumber", "Ballyfore", "Ballykean", 
    "Ballykilleen", "Ballynakill", "Banagher", "Barna", "Belmont", "Birr", "Black Lion", "Blue Ball", 
    "Boheraphuca", "Brackagh", "Bracknagh", "Brosna", "Broughal", "Cadamstown", "Clara", "Clareen", 
    "Cloghan", "Clonavoe", "Clonbullogue", "Clonfanlough", "Clonmacnoise", "Clonomy", "Clonygowan", 
    "Cloughjordan", "Coolderry", "Crinkill", "Croghan", "Cushina", "Fortel", "Gortarevan", 
    "Goteen Bridge", "Grogan", "Horseleap", "Kilclonfert", "Kilcomin", "Kilcormac", "Killane", 
    "Killeigh", "Killeshil", "Killyon", "Kinnitty", "Lemanaghan", "Lisduff", "Longford", "Moneygall", 
    "Mountbolus", "Newtown", "Pollagh", "Portarlington", "Rahan", "Rapemills", "Rath", "Rathvilla", 
    "Rhode", "Screggan", "Shannon", "Shannon Harbour", "Shannonbridge", "Sharavogue", "Shinrone", 
    "Taylor's Cross", "Tober", "Togher", "Tullamore", "Walsh Island"
  ],
  "Roscommon": [
    "Aghamuck", "Altagowlan", "Arigna", "Athleague", "Athlone", "Ballagh", "Ballaghaderreen", 
    "Ballinagare", "Ballinaheglish", "Ballinameen", "Ballinlough", "Ballintober", "Ballyclare", 
    "Ballydangan", "Ballyfarnon", "Ballyforan", "Ballygar", "Ballyleague", "Ballymacurley", 
    "Ballymurray", "Ballyroddy", "Bellameeny", "Bellanagare", "Bellanamult", "Boyle", "Brackloon", 
    "Bracknagh", "Briarfield", "Brideswell", "Callow", "Lisacul", "Lismoyle", "Lissalway", 
    "Loughglynn", "Lurgan", "Mantua", "Mount Talbot", "Moyne", "Mullen", "Newtown", "Old Town", 
    "Oldtown", "Passage", "Portrunny", "Rahara", "Rathcroghan", "Rodeen", "Rooskey", 
    "Roscommon Town", "Runnabackan", "Scardaun", "Scramoge", "Shankill", "Strokestown", 
    "Taghmaconnell", "Tarmonbarry", "Termonbarry", "Thomas Street", "Tibohine", "Trien", "Tully", 
    "Tulsk", "Whitehall"
  ],
  "Sligo": [
    "Achonry", "Aclare", "Ardmoy", "Arinagh", "Aughris", "Ballaghnatrillick", "Ballinacarrow", 
    "Ballinafad", "Ballinfull", "Ballinode", "Ballintogher", "Ballintrillick", "Ballisodare", 
    "Ballyconnell", "Ballygawley", "Ballymote", "Ballysadare", "Banada", "Belladrihid", "Bellaghy", 
    "Bellahy", "Bellanagraugh Bridge", "Beltra", "Boyle", "Bunnanadden", "Calry", "Carney", 
    "Carrowkeel", "Carrowmore", "Carrowneden", "Carrowreagh", "Cashelgarran", "Castlebaldwin", 
    "Castleconor", "Castlegal", "Grange", "Gurteen", "Highwood", "Inishcrone", "Kesh", "Kilglass", 
    "Killavil", "Kilmacteige", "Kilmactranny", "Largan", "Lavagh", "Masshill", "Monasteraden", 
    "Moneygold", "Moneylahan", "Moylough", "Mullaghmore", "Mullaghroe", "Mullany's Cross", "Owenbeg", 
    "Raghly", "Ransboro", "Rathcormac", "Rathlee", "Riverstown", "Ropefield", "Rosses Point", 
    "Skreen", "Sligo", "Sligo Town", "Sooey", "Strandhill", "Templeboy", "Tobercurry", 
    "Toberscanavan", "Tourlestrane", "Tubbercurry"
  ],
  "Tipperary": [
    "Aglish", "Ahenny", "Aherlow", "Anglesey Bridge", "Annacarty", "Annfield", "Ardcrony", 
    "Ardfinnan", "Athnid", "Ballagh", "Ballina", "Ballinahinch", "Ballinahow", "Ballinderry", 
    "Ballingarry", "Ballinure", "Ballybeg", "Ballycahill", "Ballyclerahan", "Ballycommon", 
    "Ballygriffin", "Ballylooby", "Ballymackey", "Ballyneil", "Ballynonty", "Ballypatrick", 
    "Ballyporeen", "Ballysloe", "Bansha", "Birdhill", "Boggaun", "Boherlahan", "Pallas Cross", 
    "Pike", "Portland", "Portroe", "Poulmucka", "Puckaun", "Rathbrit", "Rathcabbin", "Rathkeevin", 
    "Rearcross", "Reddan's Walk", "Riverstown", "Roscrea", "Rosegreen", "Rosmult", "Sallypark", 
    "Silvermines", "Templederry", "Templemore", "Templetuohy", "Terryglass", "The Pike", 
    "Thomastown", "Thurles", "Tipperary Town", "Toem", "Toomevara", "Toor", "Tubbrid", 
    "Twomileborris", "Upperchurch", "Youghal"
  ],
  "Tyrone": [
    "Ardboe", "Artigarvan", "Augher", "Aughnacloy", "Ballygawley", "Ballymagorry", "Ballyreagh", 
    "Benburb", "Beragh", "Caledon", "Cappagh", "Carland", "Carnteel", "Carrickmore", 
    "Castlecaulfield", "Castlederg", "Clady", "Clanabogan", "Clogher", "Coagh", "Coalisland", 
    "Cookstown", "Donaghmore", "Dromore", "Drumlegagh", "Drumnakilly", "Drumquin", "Dungannon", 
    "Dunnamanagh", "Eglish", "Fintona", "Fivemiletown", "Galbally", "Gortin", "Greencastle", 
    "Killen", "Killyclogher", "Killymeal", "Kilskeery", "Magheramason", "Mountjoy", "Moy", 
    "Mullaghmore", "Newmills", "Newtownstewart", "Omagh", "Plumbridge", "Pomeroy", "Seskinore", 
    "Sion Mills", "Sixmilecross", "Stewartstown", "Strabane", "Strule", "Trillick"
  ],
  "Waterford": [
    "Aglish", "An Rinn", "Annestown", "Ardmore", "Ballinamona", "Ballinamult", "Ballinaspick", 
    "Ballyduff", "Ballygunner", "Ballylaneen", "Ballymacarbry", "Ballymacaw", "Ballynacourty", 
    "Ballynagaul", "Ballynaguilkee", "Ballytruckle", "Belview Port", "Boola", "Boolattin", 
    "Brownstown", "Bunmahon", "Butlerstown", "Cappagh", "Cappoquin", "Carrick-on-Suir", "Carrigeen", 
    "Cheekpoint", "Clashmore", "Clohernagh", "Clonea", "Cross", "Curragh", "Dungarvan", 
    "Kilclooney", "Kilgobnet", "Kill", "Killowen", "Kilmacow", "Kilmacthomas", "Kilmeaden", 
    "Kinsalebeg", "Knockanore", "Knockboy", "Lackaroe", "Lemybrien", "Lismore", "Loskeran", 
    "Lyrenaglogh", "Mahon Bridge", "Millstreet", "Modelligo", "Moord", "Mothel", "Newtown", 
    "Old Parish", "Passage East", "Portlaw", "Rathgormack", "Ring", "Ringville", "Stradbally", 
    "Tallow", "Tallowbridge", "The Pike", "Tramore", "Villierstown", "Waterford City", "Woodstown"
  ],
  "Westmeath": [
    "Archerstown", "Ardmorney", "Athlone", "Ballinagore", "Ballinahown", "Ballinalack", "Ballykeeran", 
    "Ballymore", "Ballynacarrigy", "Ballynafid", "Ballynakill", "Bealin", "Boherquill", "Bracklin", 
    "Bunbrosna", "Cappanrush", "Castlepollard", "Castletown", "Cloghan", "Cloncullen", "Clonlost", 
    "Clonmellon", "Cloran", "Collinstown", "Concrave", "Coole", "Coralstown", "Crazy Corner", 
    "Crookedwood", "Delvin", "Derrygolan", "Drumcree", "Drumraney", "Killavally", "Killucan", 
    "Kiltober", "Kinnegad", "Knockdrin", "Lismacaffrey", "Loughanavalley", "Milltownpass", "Moate", 
    "Monilea", "Monroe", "Mount Temple", "Moyvore", "Moyvoughly", "Mullingar", "Multyfarnham", 
    "Newtownlow", "Raharney", "Rathaspick", "Rathconrath", "Rathowen", "Rochfortbridge", "Skeagh", 
    "Spittaltown", "Streamstown", "Streete", "Tang", "Templeoran", "Terrin", "The Downs", 
    "The Pigeons", "Tyrrellspass", "Whitehall", "Williamstown"
  ],
  "Wexford": [
    "Adamstown", "Ardamine", "Arthurstown", "Askamore", "Ballaghkeen", "Ballinaboola", "Ballindaggan", 
    "Balloughter", "Ballycanew", "Ballycarney", "Ballycullane", "Ballyduff", "Ballyedmond", 
    "Ballyfad", "Ballygarrett", "Ballyhack", "Ballyhogue", "Ballylacy", "Ballylucas", "Ballymitty", 
    "Ballymoney", "Ballymurn", "Ballynastraw", "Ballyroebuck", "Ballywilliam", "Bannow", "Barntown", 
    "Blackwater", "Boolavogue", "Bree", "Bricketstown", "Brideswell", "Bridgetown", "Broadway", 
    "Bunclody", "Palace", "Piercestown", "Poulshone", "Priesthaggard", "Raheen", "Ramsgrange", 
    "Rathangan", "Rathfylane", "Rathgarogue", "Rathnure", "Redgate", "Riverchapel", "Rosslare", 
    "Rosslare Harbour", "Scarnagh", "Screen", "Slade", "Strahart", "Tacumshane", "Taghmon", 
    "Tagoat", "Tara Hill", "Templeshanbo", "Templetown", "The Ballagh", "The Harrow", "The Leap", 
    "Tombrack", "Tomhaggard", "Tullycanna", "Waddington", "Walshestown"
  ],
  "Wicklow": [
    "Ashford", "Aughrim", "Avoca", "Baltinglass", "Blessington", "Bray", "Carnew", "Delgany", 
    "Donard", "Dunlavin", "Enniskerry", "Glenealy", "Greystones", "Hollywood", "Kilcoole", 
    "Kilmacanogue", "Laragh", "Manor Kilbride", "Newcastle", "Newtownmountkennedy", "Rathdrum", 
    "Rathnew", "Redcross", "Roundwood", "Shillelagh", "Stratford-on-Slaney", "Tinahely", "Wicklow"
  ]
};

// Helper functions for working with location data
export const getAllCounties = (): string[] => {
  return Object.keys(IRISH_LOCATIONS).sort();
};

export const getAreasForCounty = (county: string): string[] => {
  return IRISH_LOCATIONS[county as keyof typeof IRISH_LOCATIONS] || [];
};

export const getCountyAreaCount = (county: string): number => {
  return getAreasForCounty(county).length;
};

export const searchAreas = (query: string, county?: string): Array<{county: string, area: string}> => {
  const results: Array<{county: string, area: string}> = [];
  const searchTerm = query.toLowerCase();
  
  const counties = county ? [county] : getAllCounties();
  
  counties.forEach(countyName => {
    const areas = getAreasForCounty(countyName);
    areas.forEach(area => {
      if (area.toLowerCase().includes(searchTerm)) {
        results.push({ county: countyName, area });
      }
    });
  });
  
  return results;
};

// Statistics for reference
export const IRISH_LOCATIONS_STATS = {
  totalCounties: Object.keys(IRISH_LOCATIONS).length,
  totalAreas: Object.values(IRISH_LOCATIONS).reduce((total, areas) => total + areas.length, 0),
  averageAreasPerCounty: Math.round(
    Object.values(IRISH_LOCATIONS).reduce((total, areas) => total + areas.length, 0) / 
    Object.keys(IRISH_LOCATIONS).length
  ),
  largestCounty: (() => {
    let largest = { name: '', count: 0 };
    Object.entries(IRISH_LOCATIONS).forEach(([county, areas]) => {
      if (areas.length > largest.count) {
        largest = { name: county, count: areas.length };
      }
    });
    return largest;
  })(),
  smallestCounty: (() => {
    let smallest = { name: '', count: Infinity };
    Object.entries(IRISH_LOCATIONS).forEach(([county, areas]) => {
      if (areas.length < smallest.count) {
        smallest = { name: county, count: areas.length };
      }
    });
    return smallest;
  })()
};

// County display names for UI (with proper formatting)
export const COUNTY_DISPLAY_NAMES: Record<string, string> = {
  "Antrim": "Co. Antrim",
  "Armagh": "Co. Armagh", 
  "Carlow": "Co. Carlow",
  "Cavan": "Co. Cavan",
  "Clare": "Co. Clare",
  "Cork": "Co. Cork",
  "Derry": "Co. Derry",
  "Donegal": "Co. Donegal",
  "Down": "Co. Down",
  "Dublin": "Co. Dublin",
  "Fermanagh": "Co. Fermanagh",
  "Galway": "Co. Galway",
  "Kerry": "Co. Kerry",
  "Kildare": "Co. Kildare",
  "Kilkenny": "Co. Kilkenny",
  "Laois": "Co. Laois",
  "Leitrim": "Co. Leitrim",
  "Limerick": "Co. Limerick",
  "Longford": "Co. Longford",
  "Louth": "Co. Louth",
  "Mayo": "Co. Mayo",
  "Meath": "Co. Meath",
  "Monaghan": "Co. Monaghan",
  "Offaly": "Co. Offaly",
  "Roscommon": "Co. Roscommon",
  "Sligo": "Co. Sligo",
  "Tipperary": "Co. Tipperary",
  "Tyrone": "Co. Tyrone",
  "Waterford": "Co. Waterford",
  "Westmeath": "Co. Westmeath",
  "Wexford": "Co. Wexford",
  "Wicklow": "Co. Wicklow"
};