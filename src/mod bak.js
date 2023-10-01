"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//Config file
const modConfig = require("../config.json");
//Item template file
const itemTemplate = require("../templates/item_template.json");

class Lilly {
    preAkiLoad(container){
        this.modName = "Lilly";
        
        this.logger = container.resolve("WinstonLogger");
        this.jsonUtil = container.resolve("JsonUtil");
        
        this.logger.logWithColor(`${this.modName} : preAkiLoad finished.`,"blue");
    }
    preDBLoad(container) {        
        // green yellow blue
        this.logger.logWithColor(`${this.modName} : preDBLoad finished.`,"blue");
    }
    postDBLoad(container) {
        const DatabaseServer = container.resolve("DatabaseServer");
        const ImporterUtil = container.resolve("ImporterUtil");
        //const JsonUtil = container.resolve("JsonUtil");
        const modLoader = container.resolve("PreAkiModLoader");
        //Mod Info
        //Trader IDs
        this.traders = {
            "MFACSHOP": "MFACSHOP"
            //"prapor": "54cb50c76803fa8b248b4571",
            //"therapist": "54cb57776803fa99248b456e",
            //"skier": "58330581ace78e27b8b10cee",
            //"peacekeeper": "5935c25fb3acc3127c3d8cd9",
            //"mechanic": "5a7c2eca46aef81a7ca2145d",
            //"ragman": "5ac3b934156ae10c4430e83c",
            //"jaeger": "5c0647fdd443bc2504c2d371"
        };
        
        this.lcolor = ["default","orange","violet","grey","black","green","blue","yellow","red","tracerRed","tracerGreen","tracerYellow"];
        
/*
{
    "globals": {
        "ItemPresets": {},
        "config": {
            "Mastering": [],
            "Health": {
                "Effects": {
                    "Stimulator": {
                        "Buffs": {}
                    }
                }
            }
        }
    },
    "items": {
        "LillyAXMC": {
            "clone": "627e14b21713922ded6f2c15",
            "enable": true,
            "handbook": {
                "ParentId": "5b5f798886f77447ed5636b5",
                "Price": 1000000
            },
            "item": {
                "_props": {
                    "Chambers": [
*/
        //Get the server database and our custom database
        this.db  = DatabaseServer.getTables();
        this.mydb = ImporterUtil.loadRecursive(`${modLoader.getModPath(this.modName)}/database/`);
        //this.logger.logWithColor(this.mydb,"cyan");

        // loop
        if (modConfig.loopItem){
            this.loopDic={};// 만들것
            this.loopIds=[];// 만들것
            this.loopDels=[]; // 제거할것
            
            this.RainbowColor();
            this.loopMake();
            this.loopTrader();

            this.logger.logWithColor(`${this.modName} : loop finished.`,"blue");
        }else{
            this.logger.logWithColor(`${this.modName} : loop off.`,"blue");
        }
        
        
        //Items + Handbook
        for (const [mmID, mmItem] of Object.entries(this.mydb.items)) {
            if ("clone" in mmItem) {
                this.cloneItem(mmItem.clone, mmID);
                this.copyToFilters(mmItem.clone, mmID);
                this.addToFilters(mmID);
            }
            else {
                this.createItem(mmID);
                this.addToFilters(mmID);
            }
        }
        this.logger.logWithColor(`${this.modName} : Items + Handbook finished.`,"blue");
        
        this.logger.logWithColor(`${this.modName} : postDBLoad finished.`,"blue");
    }
    
    postAkiLoad(container) {
        this.props=[];
        this.weaps=[];
        this.weapsSlots=[];
        this.ammoCaliber={};
        this.weapClass={
            "grenadeLauncher":[],
            "pistol":[],
            "smg":[],
            "shotgun":[],
            "machinegun":[],
            "sniperRifle":[],
            "marksmanRifle":[],
            "assaultCarbine":[],
            "assaultRifle":[]
        };
        this.weapUseType={
            "primary":[],
            "secondary":[]
        };
        this.ReloadMagType={
            "ExternalMagazine":[],
            "InternalMagazine":[]
        };
        this.ReloadMode={
            "OnlyBarrel":[],
            "ExternalMagazine":[],
            "InternalMagazine":[]
        };
        for (const [id, values] of Object.entries(this.db.templates.items)) {
            if( !("_props" in values ))
                continue;
            this.props.push(values._props);
            if( "weapClass" in values._props ){
                this.weaps.push(values._props);
            }
            this.todict(this.ammoCaliber,"ammoCaliber",values)
            this.todict(this.weapClass,"weapClass",values)
            this.todict(this.weapUseType,"weapUseType",values)
            this.todict(this.ReloadMagType,"ReloadMagType",values)
            this.todict(this.ReloadMode,"ReloadMode",values)
        }
        // Magazine
        if (modConfig.MagazineCartridgesMulti != 1){
            this.multiMagazine();
            this.logger.logWithColor(`${this.modFolderName} multi Magazine finished.`, "green");
        }else{
            this.logger.logWithColor(`${this.modFolderName} multi Magazine off.`, "yellow");
        }
        if (modConfig.ExtraSizeZero){
            this.ExtraSizeZero();
            this.logger.logWithColor(`${this.modFolderName} ExtraSizeZero finished.`, "green");
        }else{
            this.logger.logWithColor(`${this.modFolderName} ExtraSizeZero off.`, "yellow");
        }
        if (modConfig.Size1){
            this.Size1();
            this.logger.logWithColor(`${this.modFolderName} Size1 finished.`, "green");
        }else{
            this.logger.logWithColor(`${this.modFolderName} Size1 off.`, "yellow");
        }
        
        ///
        if (modConfig.debug){
            this.logger.logWithColor(this.db.templates.items["Lilly.45"], "cyan");        
            for (const [id, values] of Object.entries(this.weapUseType)) {
                for (const item of values) {
                    this.logger.logWithColor(`weapUseType ; ${id} ; ${item.ShortName} ;`, "cyan");
                }
            }
            for (const [id, values] of Object.entries(this.ReloadMagType)) {
                for (const item of values) {
                    this.logger.logWithColor(`ReloadMagType ; ${id} ; ${item.ShortName} ;`, "cyan");
                }
            }
            for (const [id, values] of Object.entries(this.ReloadMode)) {
                for (const item of values) {
                    this.logger.logWithColor(`ReloadMode ; ${id} ; ${item.ShortName} ;`, "cyan");
                }
            }
        }
        
        if (modConfig.fullauto)
            for (const prop of this.weaps){
                if ( !( prop.weapFireType.includes( "fullauto" ))){
                    //this.logger.logWithColor(prop, "cyan");
                    prop.weapFireType.push("fullauto");
                }
            }
        
        this.logger.logWithColor(`${this.modName} : postAkiLoad finished.`,"blue");
    }
    
    RainbowColor(){
        for (const [mid, mitem] of Object.entries(this.mydb.items)) {
            if (modConfig.RainbowColor && "RainbowColor" in mitem && mitem["RainbowColor"] ){
                if  ("loop" in mitem) {
                    for (const [lid, litem] of Object.entries(item["loop"])) {
                        for (const ccolor of lcolor){
                            let citem=this.jsonUtil.clone(litem);
                            citem = this.compareAndReplace(citem, {
                                "item": {
                                    "_props": {
                                        "BackgroundColor": ccolor
                                    }
                                }
                            });
                            mitem["loop"][key+"_"+ccolor]=citem;
                        }
                    }
                }else{
                    for (const ccolor of lcolor){
                        mitem["loop"][ccolor]={
                            "item": {
                                "_props": {
                                    "BackgroundColor": ccolor
                                }
                            }
                        }
                    }
                }
                this.logger.logWithColor(`${this.modName} : RainbowColor add ${mid}`,"blue");
            }
        }
    }
    
    loopMake(){
        for (const [mid, mitem] of Object.entries(this.mydb.items)) {
            if (!("loop" in mitem))
                continue;
            
            
            loopIds.push(mid);
            loopDic[mid]=[];
            let itemDel=false;
            if ("enableThis" in mitem && ! mitem["enableThis"]) {
                itemDel=true;
                loopDels.push(mid);
            }
            const tloop=mitem["loop"];
            delete mitem["loop"];
            for (const [loopID, loopItem] of Object.entries(tloop)) {
                const tloopID=mid+"_"+loopID;
                loopDic[mid].push([loopID,tloopID]);
                
                let citem=this.jsonUtil.clone(mitem);
                citem = this.compareAndReplace(citem, loopItem);
                
                this.mydb.items[tloopID]=citem;
            }
            if (itemDel)
                delete this.mydb.items[mid];
        }
        this.logger.logWithColor(`${this.modName} : loopMake finished.`,"blue");
    }
    loopParentSet(arr,id){
        for (const item of arr){
            item._id=id+"_"+item._name;
            item._parent=id;
        }
    }
    loopTrader(){
        for (const trader in this.traders){
            const trader_id=this.traders[trader];
            if ( ! (trader_id in this.mydb.traders) || ! "assort" in this.mydb.traders[trader_id])
                continue;
            if ("items" in this.mydb.traders[trader_id].assort){
                const tarr = [];
                const tarrd = [];
                for (const item of this.mydb.traders[trader_id].assort.items) {
                    if ( loop_mmIDs.includes(item._tpl)){
                        for (const loopID of loop_mmIDd[item._tpl]) {
                            const citem=this.jsonUtil.clone(item);
                            citem._id=loopID[1];
                            citem._tpl=loopID[1];
                            tarr.push(citem);
                        }
                    }
                    if (  loop_mmIDsDel.includes(item._tpl))
                        tarrd.push(item);
                }
                this.mydb.traders[trader_id].assort["items"]=this.mydb.traders[trader_id].assort.items.filter( ( el ) => !tarrd.includes( el ) );
                this.mydb.traders[trader_id].assort.items.push(...tarr);
            }
            //this.logger.logWithColor(`${trader_id} barter_scheme.`, "green");
            if ("barter_scheme" in this.mydb.traders[trader_id].assort){
                for (const [mmID, mmItem] of Object.entries( this.mydb.traders[trader_id].assort.barter_scheme)) {
                    if (  loop_mmIDs.includes(mmID)){
                        for (const loopID of loop_mmIDd[mmID]) {
                            //this.logger.logWithColor(`mmID ${mmID} loopID ${loopID} `, "blue");
                            this.mydb.traders[trader_id].assort.barter_scheme[loopID[1]]=mmItem;
                        }
                    }
                    if (loop_mmIDsDel.includes(mmID))
                        delete this.mydb.traders[trader_id].assort.barter_scheme[mmID];
                }
            }
            //this.logger.logWithColor(`${trader_id} loyal_level_items.`, "green");
            if ("loyal_level_items" in this.mydb.traders[trader_id].assort){
                for (const [mmID, mmItem] of Object.entries(  this.mydb.traders[trader_id].assort.loyal_level_items)) {
                    if ( loop_mmIDs.includes(mmID)){
                        for (const loopID of loop_mmIDd[mmID]) {
                            //this.logger.logWithColor(`mmID ${mmID} loopID ${loopID} `, "blue");
                            this.mydb.traders[trader_id].assort.loyal_level_items[loopID[1]]=mmItem;
                        }
                    }
                    if ( loop_mmIDsDel.includes(mmID))
                        delete this.mydb.traders[trader_id].assort.loyal_level_items[mmID];
                }
            }
            //this.logger.logWithColor(`${trader_id} set.`, "green");
            //this.logger.logWithColor(this.mydb.traders[trader_id], "grey");
            //this.logger.logWithColor(`Lilly : loop add to ${trader} finished.`,"cyan");
        }
        this.logger.logWithColor(`${this.modName} : loopTrader finished.`,"blue");
    }
    
    
    compareAndReplace(originalItem, attributesToChange) {
        //Recursive function to find attributes in the original item/clothing object and change them.
        //This is done so each attribute does not have to be manually changed and can instead be read from properly formatted json
        //Requires the attributes to be in the same nested object format as the item entry in order to work (see items.json and items.json in SPT install)
        for (const key in attributesToChange) {
            //If you've reached the end of a nested series, try to change the value in original to new
            if (! (key in originalItem)){
                originalItem[key] = attributesToChange[key];
                //continue;
            } else
            if ((["boolean", "string", "number"].includes(typeof attributesToChange[key])) || Array.isArray(attributesToChange[key])) {
                //this.logger.logWithColor("compareAndReplace", "blue");
                //this.logger.logWithColor(originalItem, "yellow");
                //this.logger.logWithColor(attributesToChange, "green");
                if (key in originalItem)
                    originalItem[key] = attributesToChange[key];
                else
                    this.logger.error("There was an error finding the attribute: \"" + key + "\", using default value instead.");
            }
            //Otherwise keep traveling down the nest
            else
                originalItem[key] = this.compareAndReplace(originalItem[key], attributesToChange[key]);
        }
        return originalItem;
    }
    
    cloneItem(itemToClone, mmID) {
        //If the item is enabled in the json
        if (this.mydb.items[mmID].enable == true) {
            //Get a clone of the original item from the database
            let atlasItemOut = this.jsonUtil.clone(this.db.templates.items[itemToClone]);
            //Change the necessary item attributes using the info in our database file items.json
            atlasItemOut._id = mmID;
            atlasItemOut = this.compareAndReplace(atlasItemOut, this.mydb.items[mmID]["item"]);
            
            const _props=atlasItemOut._props;
            if ("Cartridges" in _props) this.loopParentSet(_props.Cartridges,atlasItemOut._id);
            if ("StackSlots" in _props) this.loopParentSet(_props.StackSlots,atlasItemOut._id);
            if ("Slots" in _props) this.loopParentSet(_props.Slots,atlasItemOut._id);
            if ("Grids" in _props) this.loopParentSet(_props.Grids,atlasItemOut._id);
            
            //Add the compatibilities and conflicts specific to ATLAS into the new item
            const atlasCompatibilities = (typeof this.mydb.items[mmID].mmCompatibilities == "undefined") ? {} : this.mydb.items[mmID].mmCompatibilities;
            const atlasConflicts = (typeof this.mydb.items[mmID].mmConflicts == "undefined") ? [] : this.mydb.items[mmID].mmConflicts;
            for (const modSlotName in atlasCompatibilities) {
                for (const slot of atlasItemOut._props.Slots) {
                    if (slot._name === modSlotName)
                        for (const id of atlasCompatibilities[modSlotName])
                            slot._props.filters[0].Filter.push(id);
                }
            }
            if (!( "ConflictingItems" in atlasItemOut._props))
                atlasItemOut._props.ConflictingItems=[];
            atlasItemOut._props.ConflictingItems = atlasItemOut._props.ConflictingItems.concat(atlasConflicts);
            //Add the new item to the database
            this.db.templates.items[mmID] = atlasItemOut;
            this.logger.debug("Item " + mmID + " created as a clone of " + itemToClone + " and added to database.");
            //Create the handbook entry for the items
            const handbookEntry = {
                "Id": mmID,
                "ParentId": this.mydb.items[mmID]["handbook"]["ParentId"],
                "Price": this.mydb.items[mmID]["handbook"]["Price"]
            };
            //Add the handbook entry to the database
            this.db.templates.handbook.Items.push(handbookEntry);
            this.logger.debug("Item " + mmID + " added to handbook with price " + handbookEntry.Price);
        }
    }
    createItem(itemToCreate) {
        //Create an item from scratch instead of cloning it
        //Requires properly formatted entry in items.json with NO "clone" attribute
        //Get the new item object from the json
        const newItem = this.mydb.items[itemToCreate];
        //If the item is enabled in the json
        if (newItem.enable) {
            //Check the structure of the new item in items
            const [pass, checkedItem] = this.checkItem(newItem);
            if (!pass)
                return;
            //Add the new item to the database
            this.db.templates.items[itemToCreate] = checkedItem;
            this.logger.debug("Item " + itemToCreate + " created and added to database.");
            //Create the handbook entry for the items
            const handbookEntry = {
                "Id": itemToCreate,
                "ParentId": newItem["handbook"]["ParentId"],
                "Price": newItem["handbook"]["Price"]
            };
            //Add the handbook entry to the database
            this.db.templates.handbook.Items.push(handbookEntry);
            this.logger.debug("Item " + itemToCreate + " added to handbook with price " + handbookEntry.Price);
        }
    }
    copyToFilters(itemClone, mmID) {
        //Find the original item in all compatible and conflict filters and add the clone to those filters as well
        for (const item in this.db.templates.items) {
            if (item in this.mydb.items)
                continue;
            const [filters, conflictingItems] = this.getFilters(item);
            for (const filter of filters) {
                for (const id of filter._props.filters[0].Filter) {
                    if (id === itemClone)
                        filter._props.filters[0].Filter.push(mmID);
                }
            }
            for (const conflictID of conflictingItems)
                if (conflictID === itemClone)
                    conflictingItems.push(mmID);
        }
    }
    addToFilters(mmID) {
        //Add a new item to compatibility & conflict filters of pre-existing items
        const atlasNewItem = this.mydb.items[mmID];
        if ("compatibilities" in atlasNewItem) {
            for (const modSlotName in atlasNewItem.compatibilities) {
                for (const compatibleItem of atlasNewItem.compatibilities[modSlotName]) {
                    const filters = this.getFilters(compatibleItem)[0];
                    for (const filter of filters) {
                        if (modSlotName === filter._name)
                            filter._props.filters[0].Filter.push(mmID);
                    }
                }
            }
        }
        if ("conflicts" in atlasNewItem) {
            for (const conflictingItem of atlasNewItem.conflicts) {
                const conflictingItems = this.getFilters(conflictingItem)[1];
                conflictingItems.push(mmID);
            }
        }
    }
    getFilters(item) {
        //Get the slots, chambers, cartridges, and conflicting items objects and return them.
        const slots = (typeof this.db.templates.items[item]._props.Slots === "undefined") ? [] : this.db.templates.items[item]._props.Slots;
        const chambers = (typeof this.db.templates.items[item]._props.Chambers === "undefined") ? [] : this.db.templates.items[item]._props.Chambers;
        const cartridges = (typeof this.db.templates.items[item]._props.Cartridges === "undefined") ? [] : this.db.templates.items[item]._props.Cartridges;
        const filters = slots.concat(chambers, cartridges);
        const conflictingItems = (typeof this.db.templates.items[item]._props.ConflictingItems === "undefined") ? [] : this.db.templates.items[item]._props.ConflictingItems;
        return [filters, conflictingItems];
    }
    
    todict(arr,name,values){
        if( name in values._props ){
            if ( values._props[name] in arr){
                arr[values._props[name]].push(values);
            }else{
                arr[values._props[name]]=[values];
            }
        }
    }
    Size1(){
        let myprops=this.props;
        if (modConfig.SizeExcludeWeaps)
            myprops = myprops.filter( ( el ) => !this.weaps.includes( el ) );
        
        if (modConfig.SizeHeight1)
            for (const prop of myprops){
                prop.Height=1;
            }
        if (modConfig.SizeWidth1)
            for (const prop of myprops){
                prop.Width=1;
            }
        if (modConfig.WeapsSizeHeight1)
            for (const prop of this.weaps){
                prop.Height=1;
            }
        if (modConfig.WeapsSizeWidth1)
            for (const prop of this.weaps){
                prop.Width=1;
            }

    }
    ExtraSizeZero(){
        if (modConfig.ExtraSizeLeftZero){
            for (const prop of this.props)
                prop.ExtraSizeLeft=0;
            this.logger.logWithColor(`${this.modFolderName} ExtraSizeLeftZero finished.`, "green");
        }else
            this.logger.logWithColor(`${this.modFolderName} ExtraSizeLeftZero off.`, "yellow");
        if (modConfig.ExtraSizeDownZero){
            for (const prop of this.props)
                prop.ExtraSizeDown=0;
            this.logger.logWithColor(`${this.modFolderName} ExtraSizeDownZero finished.`, "green");
        }else
            this.logger.logWithColor(`${this.modFolderName} ExtraSizeDownZero off.`, "yellow");
        if (modConfig.ExtraSizeUpZero){
            for (const prop of this.props)
                prop.ExtraSizeUp=0;
            this.logger.logWithColor(`${this.modFolderName} ExtraSizeUpZero finished.`, "green");
        }else
            this.logger.logWithColor(`${this.modFolderName} ExtraSizeUpZero off.`, "yellow");
        if (modConfig.ExtraSizeRightZero){
            for (const prop of this.props)
                prop.ExtraSizeRight=0;
            this.logger.logWithColor(`${this.modFolderName} ExtraSizeRightZero finished.`, "green");
        }else
            this.logger.logWithColor(`${this.modFolderName} ExtraSizeRightZero off.`, "yellow");

    }
    multiMagazine(){
        for (const [id, values] of Object.entries(this.db.templates.items)) {
            if( !("_props" in values ))
                continue;
            const _props=values._props;
            if( !("Cartridges" in _props ))
                continue;
            //this.logger.logWithColor(`${id}`, "gray");
            const Cartridges=_props.Cartridges;
            //this.logger.logWithColor(`${Cartridges.length}`, "gray");
            if (Cartridges.length==0 || _props.Slots.length>0)
                continue;
            for (const mag of Cartridges){
                //this.logger.logWithColor(`${mag._max_count}`, "gray");
                mag._max_count*=modConfig.MagazineCartridgesMulti;
            }
            if (modConfig.MagazineCartridgesSize){
                _props.Height=1;
                _props.Width=1;
                _props.ExtraSizeLeft=0;
                _props.ExtraSizeDown=0;
                _props.ExtraSizeUp=0;
                _props.ExtraSizeRight=0;
            }
            //this.logger.logWithColor(values, "cyan");
            //this.logger.logWithColor(`Lilly Magazine set : ${values._name}`, "cyan");
        }
    }
    
}
module.exports = { mod: new Lilly() };















