use std::collections::HashMap;
use std::error::Error;

use enzymeml_rs::enzyme_ml;
use enzymeml_rs::prelude::UnitDefinition;
use enzymeml_rs::unit;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UnitType {
    Volume,
    Mass,
    Time,
    Moles,
    Concentration,
    MassConcentration,
    Temperature,
}

impl From<String> for UnitType {
    fn from(s: String) -> Self {
        match s.as_str() {
            "volume" => UnitType::Volume,
            "mass" => UnitType::Mass,
            "time" => UnitType::Time,
            "moles" => UnitType::Moles,
            "concentration" => UnitType::Concentration,
            "mass_concentration" => UnitType::MassConcentration,
            "temperature" => UnitType::Temperature,
            _ => panic!("Invalid unit type"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnitDefinitions {
    pub volume: HashMap<String, UnitDefinition>,
    pub mass: HashMap<String, UnitDefinition>,
    pub time: HashMap<String, UnitDefinition>,
    pub moles: HashMap<String, UnitDefinition>,
    pub concentration: HashMap<String, UnitDefinition>,
    pub mass_concentration: HashMap<String, UnitDefinition>,
    pub temperature: HashMap<String, UnitDefinition>,
}

impl UnitDefinitions {
    pub fn get_units(unit_type: UnitType) -> Result<HashMap<String, UnitDefinition>, Box<dyn Error>> {
        let units = UnitDefinitions::default();
        
        match unit_type {
            UnitType::Volume => Ok(units.volume),
            UnitType::Mass => Ok(units.mass),
            UnitType::Time => Ok(units.time),
            UnitType::Moles => Ok(units.moles),
            UnitType::Concentration => Ok(units.concentration),
            UnitType::MassConcentration => Ok(units.mass_concentration),
            UnitType::Temperature => Ok(units.temperature),
        }
    }
    pub fn get_unit(unit: &str) -> Result<UnitDefinition, Box<dyn Error>> {
        let units = UnitDefinitions::default();
        
        if let Some(unit) = units.volume.get(unit) {
            return Ok(unit.clone());
        }
        if let Some(unit) = units.mass.get(unit) {
            return Ok(unit.clone());
        }
        if let Some(unit) = units.time.get(unit) {
            return Ok(unit.clone());
        }
        if let Some(unit) = units.moles.get(unit) {
            return Ok(unit.clone());
        }
        if let Some(unit) = units.concentration.get(unit) {
            return Ok(unit.clone());
        }
        if let Some(unit) = units.mass_concentration.get(unit) {
            return Ok(unit.clone());
        }
        if let Some(unit) = units.temperature.get(unit) {
            return Ok(unit.clone());
        }

        Err("Unit not found".into())
    }
}

impl Default for UnitDefinitions {
    fn default() -> Self {
        UnitDefinitions {
            volume: volumetric_units(),
            mass: mass_units(),
            time: time_units(),
            moles: moles_units(),
            concentration: concentration_units(),
            mass_concentration: mass_concentration_units(),
            temperature: temperature_units(),
        }
    }
}

// Volumetric
fn volumetric_units() -> HashMap<String, UnitDefinition> {
    let mut units = HashMap::new();

    units.insert("l".to_string(), unit!([_ litre]));
    units.insert("ml".to_string(), unit!([m litre]));
    units.insert("ul".to_string(), unit!([u litre]));
    units.insert("nl".to_string(), unit!([n litre]));
    units.insert("pl".to_string(), unit!([p litre]));

    units
}

// Mass
fn mass_units() -> HashMap<String, UnitDefinition> {
    let mut units = HashMap::new();

    units.insert("g".to_string(), unit!([_ gram]));
    units.insert("mg".to_string(), unit!([m gram]));
    units.insert("ug".to_string(), unit!([u gram]));
    units.insert("ng".to_string(), unit!([n gram]));
    units.insert("pg".to_string(), unit!([p gram]));

    units
}

// Time
fn time_units() -> HashMap<String, UnitDefinition> {
    let mut units = HashMap::new();

    units.insert("days".to_string(), unit!([_ hours]));
    units.insert("hours".to_string(), unit!([_ hours]));
    units.insert("mins".to_string(), unit!([_ minutes]));
    units.insert("s".to_string(), unit!([_ second]));
    units.insert("ms".to_string(), unit!([m second]));
    units.insert("us".to_string(), unit!([u second]));
    units.insert("ns".to_string(), unit!([n second]));
    units.insert("ps".to_string(), unit!([p second]));

    units
}

// Concentration (Moles)
fn moles_units() -> HashMap<String, UnitDefinition> {
    let mut units = HashMap::new();

    units.insert("mol".to_string(), unit!([_ mole]));
    units.insert("mmol".to_string(), unit!([m mole]));
    units.insert("umol".to_string(), unit!([u mole]));
    units.insert("nmol".to_string(), unit!([n mole]));
    units.insert("pmol".to_string(), unit!([p mole]));

    units
}

// Concentration (Molarity)
fn concentration_units() -> HashMap<String, UnitDefinition> {
    let mut units = HashMap::new();

    units.insert("M".to_string(), unit!([_ mole] / [_ litre]));
    units.insert("mM".to_string(), unit!([m mole] / [_ litre]));
    units.insert("uM".to_string(), unit!([u mole] / [_ litre]));
    units.insert("nM".to_string(), unit!([n mole] / [_ litre]));
    units.insert("pM".to_string(), unit!([p mole] / [_ litre]));

    units
}

// Concentration (Mass)
fn mass_concentration_units() -> HashMap<String, UnitDefinition> {
    let mut units = HashMap::new();

    units.insert("g/l".to_string(), unit!([_ gram] / [_ litre]));
    units.insert("mg/l".to_string(), unit!([m gram] / [_ litre]));
    units.insert("ug/l".to_string(), unit!([u gram] / [_ litre]));
    units.insert("ng/l".to_string(), unit!([n gram] / [_ litre]));
    units.insert("pg/l".to_string(), unit!([p gram] / [_ litre]));

    units
}


// Temperature
fn temperature_units() -> HashMap<String, UnitDefinition> {
    let mut units = HashMap::new();

    units.insert("K".to_string(), unit!([_ kelvin]));

    units
}