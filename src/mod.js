"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//Config file
const modConfig = require("../config.json");
//Item template file
const itemTemplate = require("../templates/item_template.json");
class MItems {
    postDBLoad(container) {
        this.logger = container.resolve("WinstonLogger");
        this.jsonUtil = container.resolve("JsonUtil");
        const databaseServer = container.resolve("DatabaseServer");
        const databaseImporter = container.resolve("ImporterUtil");
        const modLoader = container.resolve("PreAkiModLoader");
        //Mod Info
        const modFolderName = "Lilly";
        const modFullName = "Lilly";
        //Trader IDs
        const traders = {
            "MFACSHOP": "MFACSHOP",
            "prapor": "54cb50c76803fa8b248b4571",
            "therapist": "54cb57776803fa99248b456e",
            "skier": "58330581ace78e27b8b10cee",
            "peacekeeper": "5935c25fb3acc3127c3d8cd9",
            "mechanic": "5a7c2eca46aef81a7ca2145d",
            "ragman": "5ac3b934156ae10c4430e83c",
            "jaeger": "5c0647fdd443bc2504c2d371"
        };
        // color
        const lcolor = ["default","orange","violet","grey","black","green","blue","yellow","red"];
        //Get the server database and our custom database
        this.db = databaseServer.getTables();
        this.mydb = databaseImporter.loadRecursive(`${modLoader.getModPath(modFolderName)}database/`);
        this.logger.info("Loading: " + modFullName);
        //Locales (Languages)
        this.addLocales();
        this.logger.debug(modFolderName + " locales finished");
        //
        const tdic = {};
        for (const [mmID, mmItem] of Object.entries(this.mydb.mm_items)) {
            if ("RainbowColor" in mmItem && mmItem.RainbowColor == true) {
                for (const ccolor of lcolor){
                    const cmmItem=this.jsonUtil.clone(mmItem);
                    cmmItem.item._props.BackgroundColor=ccolor;
                    this.mydb.mm_items[mmID+"_"+ccolor]=cmmItem;
                    this.logger.logWithColor(`${mmID}_${ccolor} add`, "green");
                }
                //for (const trader in this.mydb.traders){
                //    this.logger.info("trader : "+trader);
                //}
                
                for (const trader in traders){
                    const trader_id=traders[trader];
                    this.logger.logWithColor(`trader : ${trader} ; ${trader_id}`, "blue");
                    if ( ! trader_id in this.mydb.traders || ! "assort" in this.mydb.traders[trader_id])
                        continue
                    //
                    const tarr = [];
                    if ("items" in this.mydb.traders[trader_id].assort){
                        for (const item of this.mydb.traders[trader_id].assort.items) {
                            //this.logger.logWithColor(`${item._id} items check.`, "grey");
                            if(item._id == mmID){
                                this.logger.logWithColor(`${item._id} items check.`, "grey");
                                for (const ccolor of lcolor){
                                    const citem=this.jsonUtil.clone(item);
                                    citem._id=mmID+"_"+ccolor;
                                    citem._tpl=mmID+"_"+ccolor;
                                    tarr.push(citem);
                                    //this.logger.logWithColor(citem, "grey");
                                }
                            }
                        }
                        tdic[trader_id]=tarr;
                        //this.mydb.traders[trader_id].assort.items.push(...tarr);
                        //this.logger.logWithColor(tarr, "grey");
                        //this.logger.logWithColor(this.mydb.traders[trader_id].assort.items, "grey");
                        //this.logger.logWithColor(Array.isArray(this.mydb.traders[trader_id].assort.items), "grey");
                        this.logger.logWithColor(`${mmID} ${tarr.length} add length.`, "green");
                        //this.logger.logWithColor(`${mmID} ${this.mydb.traders[trader_id].assort.items.length} items length.`, "green");
                    }else
                        this.logger.logWithColor(`${mmID} items no.`, "yellow");
                    //
                    if ("barter_scheme" in this.mydb.traders[trader_id].assort && mmID in this.mydb.traders[trader_id].assort.barter_scheme ) {
                        for (const ccolor of lcolor){
                            this.mydb.traders[trader_id].assort.barter_scheme[mmID+"_"+ccolor]=this.mydb.traders[trader_id].assort.barter_scheme[mmID];
                        }
                        this.logger.logWithColor(`${mmID} barter_scheme add.`, "green");
                    }else{
                        this.logger.logWithColor(`${mmID} barter_scheme no.`, "yellow");
                    }
                    //
                    if ("loyal_level_items" in this.mydb.traders[trader_id].assort && mmID in this.mydb.traders[trader_id].assort.loyal_level_items ) {
                        for (const ccolor of lcolor){
                            this.mydb.traders[trader_id].assort.loyal_level_items[mmID+"_"+ccolor]=this.mydb.traders[trader_id].assort.loyal_level_items[mmID];
                        }
                        this.logger.logWithColor(`${mmID} loyal_level_items add.`, "green");
                    }else{
                        this.logger.logWithColor(`${mmID} loyal_level_items no.`, "yellow");
                    }
                }
                //delete this.mydb.mm_items[mmID];
            }
            else
                this.logger.logWithColor(`${mmID} RainbowColor false.`, "yellow");
        }        
        //this.logger.logWithColor(tdic, "grey");
        for (const [trader_id, tarr] of Object.entries(tdic)) {
            this.mydb.traders[trader_id].assort.items.push(...tarr);
        }
        this.logger.logWithColor(`${modFolderName} RainbowColor finished.`, "blue");
        //Items + Handbook
        for (const [mmID, mmItem] of Object.entries(this.mydb.mm_items)) {
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
        this.logger.debug(modFolderName + " items and handbook finished");
        //Clothing
        for (const newArticle in this.mydb.mm_clothes)
            this.cloneClothing(this.mydb.mm_clothes[newArticle].clone, newArticle);
        this.logger.debug(modFolderName + " clothing finished");
        //Presets
        for (const preset in this.mydb.globals.ItemPresets)
            this.db.globals.ItemPresets[preset] = this.mydb.globals.ItemPresets[preset];
        this.logger.debug(modFolderName + " presets finished");
        //Traders
        for (const trader in traders)
            this.addTraderAssort(traders[trader]);
        for (const suit of this.mydb.traders[traders["ragman"]].suits)
            this.db.traders[traders["ragman"]].suits.push(suit);
        this.logger.debug(modFolderName + " traders finished");
        //Mastery
        const dbMastering = this.db.globals.config.Mastering;
        for (const weapon in this.mydb.globals.config.Mastering)
            dbMastering.push(this.mydb.globals.config.Mastering[weapon]);
        for (const weapon in dbMastering) {
        }
        //for (const weapon in dbMastering) {}
        this.logger.debug(modFolderName + " mastery finished");
        //Stimulator buffs
        for (const sbuffs in this.mydb.globals.config.Health.Effects.Stimulator.Buffs)
            this.db.globals.config.Health.Effects.Stimulator.Buffs[sbuffs] = this.mydb.globals.config.Health.Effects.Stimulator.Buffs[sbuffs];
        //for (const buffs in buffs) {}
        this.logger.debug(modFolderName + " buffs finished");
    }
    cloneItem(itemToClone, mmID) {
        //If the item is enabled in the json
        if (this.mydb.mm_items[mmID].enable == true) {
            //Get a clone of the original item from the database
            let atlasItemOut = this.jsonUtil.clone(this.db.templates.items[itemToClone]);
            //Change the necessary item attributes using the info in our database file mm_items.json
            atlasItemOut._id = mmID;
            atlasItemOut = this.compareAndReplace(atlasItemOut, this.mydb.mm_items[mmID]["item"]);
            //Add the compatibilities and conflicts specific to ATLAS into the new item
            const atlasCompatibilities = (typeof this.mydb.mm_items[mmID].mmCompatibilities == "undefined") ? {} : this.mydb.mm_items[mmID].mmCompatibilities;
            const atlasConflicts = (typeof this.mydb.mm_items[mmID].mmConflicts == "undefined") ? [] : this.mydb.mm_items[mmID].mmConflicts;
            for (const modSlotName in atlasCompatibilities) {
                for (const slot of atlasItemOut._props.Slots) {
                    if (slot._name === modSlotName)
                        for (const id of atlasCompatibilities[modSlotName])
                            slot._props.filters[0].Filter.push(id);
                }
            }
            atlasItemOut._props.ConflictingItems = atlasItemOut._props.ConflictingItems.concat(atlasConflicts);
            //Add the new item to the database
            this.db.templates.items[mmID] = atlasItemOut;
            this.logger.debug("Item " + mmID + " created as a clone of " + itemToClone + " and added to database.");
            //Create the handbook entry for the items
            const handbookEntry = {
                "Id": mmID,
                "ParentId": this.mydb.mm_items[mmID]["handbook"]["ParentId"],
                "Price": this.mydb.mm_items[mmID]["handbook"]["Price"]
            };
            //Add the handbook entry to the database
            this.db.templates.handbook.Items.push(handbookEntry);
            this.logger.debug("Item " + mmID + " added to handbook with price " + handbookEntry.Price);
        }
    }
    createItem(itemToCreate) {
        //Create an item from scratch instead of cloning it
        //Requires properly formatted entry in mm_items.json with NO "clone" attribute
        //Get the new item object from the json
        const newItem = this.mydb.mm_items[itemToCreate];
        //If the item is enabled in the json
        if (newItem.enable) {
            //Check the structure of the new item in mm_items
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
    checkItem(itemToCheck) {
        //A very basic top-level check of an item to make sure it has the proper attributes
        //Also convert to ITemplateItem to avoid errors
        let pass = true;
        //First make sure it has the top-level 5 entries needed for an item
        for (const level1 in itemTemplate) {
            if (!(level1 in itemToCheck.item)) {
                this.logger.error("ERROR - Missing attribute: \"" + level1 + "\" in your item entry!");
                pass = false;
            }
        }
        //Then make sure the attributes in _props exist in the item template, warn user if not.
        for (const prop in itemToCheck.item._props) {
            if (!(prop in itemTemplate._props))
                this.logger.warning("WARNING - Attribute: \"" + prop + "\" not found in item template!");
        }
        const itemOUT = {
            "_id": itemToCheck.item._id,
            "_name": itemToCheck.item._name,
            "_parent": itemToCheck.item._parent,
            "_props": itemToCheck.item._props,
            "_type": itemToCheck.item._type,
            "_proto": itemToCheck.item._proto
        };
        return [pass, itemOUT];
    }
    compareAndReplace(originalItem, attributesToChange) {
        //Recursive function to find attributes in the original item/clothing object and change them.
        //This is done so each attribute does not have to be manually changed and can instead be read from properly formatted json
        //Requires the attributes to be in the same nested object format as the item entry in order to work (see mm_items.json and items.json in SPT install)
        for (const key in attributesToChange) {
            //If you've reached the end of a nested series, try to change the value in original to new
            if ((["boolean", "string", "number"].includes(typeof attributesToChange[key])) || Array.isArray(attributesToChange[key])) {
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
    getFilters(item) {
        //Get the slots, chambers, cartridges, and conflicting items objects and return them.
        const slots = (typeof this.db.templates.items[item]._props.Slots === "undefined") ? [] : this.db.templates.items[item]._props.Slots;
        const chambers = (typeof this.db.templates.items[item]._props.Chambers === "undefined") ? [] : this.db.templates.items[item]._props.Chambers;
        const cartridges = (typeof this.db.templates.items[item]._props.Cartridges === "undefined") ? [] : this.db.templates.items[item]._props.Cartridges;
        const filters = slots.concat(chambers, cartridges);
        const conflictingItems = (typeof this.db.templates.items[item]._props.ConflictingItems === "undefined") ? [] : this.db.templates.items[item]._props.ConflictingItems;
        return [filters, conflictingItems];
    }
    copyToFilters(itemClone, mmID) {
        //Find the original item in all compatible and conflict filters and add the clone to those filters as well
        for (const item in this.db.templates.items) {
            if (item in this.mydb.mm_items)
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
        const atlasNewItem = this.mydb.mm_items[mmID];
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
    cloneClothing(itemToClone, mmID) {
        //Get a clone of the original item from the database
        let atlasClothingOut = this.jsonUtil.clone(this.db.templates.customization[itemToClone]);
        //Change the necessary clothing item attributes using the info in our database file atlas_clothes.json
        atlasClothingOut._id = mmID;
        atlasClothingOut._name = mmID;
        atlasClothingOut = this.compareAndReplace(atlasClothingOut, this.mydb.mm_clothes[mmID]["customization"]);
        //Add the new item to the database
        this.db.templates.customization[mmID] = atlasClothingOut;
        this.logger.debug("Clothing item " + mmID + " created as a clone of " + itemToClone + " and added to database.");
    }
    addTraderAssort(trader) {
        //Items
        for (const item in this.mydb.traders[trader].assort.items) {
            //this.logger.info("items " + this.mydb.traders[trader].assort.items[item]._tpl + " added to " + trader);
            this.db.traders[trader].assort.items.push(this.mydb.traders[trader].assort.items[item]);
        }
        //Barter Scheme
        for (const item in this.mydb.traders[trader].assort.barter_scheme) {
            //this.logger.info("barter_scheme " + item + " added to " + trader);
            this.db.traders[trader].assort.barter_scheme[item] = this.mydb.traders[trader].assort.barter_scheme[item];
        }
        //Loyalty Levels
        for (const item in this.mydb.traders[trader].assort.loyal_level_items) {
            //this.logger.info("loyal_level_items " + item + " added to " + trader);
            if (modConfig.lvl1Traders)
                this.db.traders[trader].assort.loyal_level_items[item] = 1;
            else
                this.db.traders[trader].assort.loyal_level_items[item] = this.mydb.traders[trader].assort.loyal_level_items[item];
        }
    }
    addLocales() {
        if (modConfig.oldLocales) //If you are using the old locales
         {
            for (const localeID in this.db.locales.global) {
                if (this.mydb.old_locales.global[localeID]) //If the locale is included in the mod, add it
                 {
                    for (const entry in this.mydb.old_locales.global[localeID].templates)
                        this.db.locales.global[localeID].templates[entry] = this.mydb.old_locales.global[localeID].templates[entry];
                    for (const entry in this.mydb.old_locales.global[localeID].preset)
                        this.db.locales.global[localeID].preset[entry] = this.mydb.old_locales.global[localeID].preset[entry];
                }
                else //Otherwise use the english locale as default
                 {
                    for (const entry in this.mydb.old_locales.global.en.templates)
                        this.db.locales.global[localeID].templates[entry] = this.mydb.old_locales.global.en.templates[entry];
                    for (const entry in this.mydb.old_locales.global.en.preset)
                        this.db.locales.global[localeID].preset[entry] = this.mydb.old_locales.global.en.preset[entry];
                }
            }
        }
        else //Otherwise use the normal locales
         {
            for (const localeID in this.db.locales.global) {
                if (this.mydb.locales.global[localeID]) //If the locale is included in the mod, add it
                 {
                    for (const entry in this.mydb.locales.global[localeID])
                        this.db.locales.global[localeID][entry] = this.mydb.locales.global[localeID][entry];
                }
                else //Otherwise use the english locale as default
                 {
                    for (const entry in this.mydb.locales.global.en)
                        this.db.locales.global[localeID][entry] = this.mydb.locales.global.en[entry];
                }
            }
        }
    }
}
module.exports = { mod: new MItems() };
