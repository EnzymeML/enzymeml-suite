//! Database models and conversion traits
//!
//! This module contains all database models used in the application and their conversion traits.
//! The models are used to store data in the SQLite database and are mapped to the corresponding
//! tables using diesel. Each model has a corresponding "New" struct that is used for inserting
//! new records into the database.
//!
//! The module also provides conversion traits to convert between EnzymeML types and database types.
//! This allows for seamless conversion between the two type systems.
//!
//! # Models
//! - Document: Represents a document in the database
//! - DBSmallMolecule: Represents a small molecule in the database
//! - DBProtein: Represents a protein in the database
//! - DBVessel: Represents a vessel in the database
//! - DBCreator: Represents a creator in the database
//!
//! Each model has a corresponding "New" struct for database insertions.

use super::schema::*;
use diesel::prelude::*;
use enzymeml::versions::v2;
use serde::{Deserialize, Serialize};

/// Represents a document in the database
#[derive(Queryable, Identifiable, AsChangeset, Selectable, Debug)]
#[diesel(table_name = documents)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Document {
    pub id: i32,
    pub title: String,
    pub content: String,
}

/// Represents a new document to be inserted into the database
#[derive(Insertable, Debug)]
#[diesel(table_name = documents)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct NewDocument<'a> {
    pub title: &'a str,
    pub content: &'a str,
}

/// Represents a small molecule in the database
#[derive(Queryable, Identifiable, AsChangeset, Selectable, Debug, Serialize, Deserialize)]
#[diesel(table_name = small_molecules)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DBSmallMolecule {
    pub id: i32,
    pub name: String,
    pub canonical_smiles: Option<String>,
    pub inchi: Option<String>,
    pub inchikey: Option<String>,
    pub references: Option<String>,
}

/// Represents a new small molecule to be inserted into the database
#[derive(Insertable, AsChangeset, Debug)]
#[diesel(table_name = small_molecules)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DBNewSmallMolecule<'a> {
    pub name: &'a str,
    pub canonical_smiles: Option<&'a str>,
    pub inchi: Option<&'a str>,
    pub inchikey: Option<&'a str>,
    pub references: Option<String>,
}

/// Represents a protein in the database
#[derive(Queryable, Identifiable, AsChangeset, Selectable, Debug)]
#[diesel(table_name = proteins)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DBProtein {
    pub id: i32,
    pub name: String,
    pub sequence: Option<String>,
    pub ecnumber: Option<String>,
    pub organism: Option<String>,
    pub organism_tax_id: Option<String>,
}

/// Represents a new protein to be inserted into the database
#[derive(Insertable, Debug)]
#[diesel(table_name = proteins)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DBNewProtein<'a> {
    pub name: &'a str,
    pub sequence: Option<&'a str>,
    pub ecnumber: Option<&'a str>,
    pub organism: Option<&'a str>,
    pub organism_tax_id: Option<&'a str>,
}

/// Represents a vessel in the database
#[derive(Queryable, Identifiable, AsChangeset, Selectable, Debug)]
#[diesel(table_name = vessels)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DBVessel {
    pub id: i32,
    pub name: String,
    pub volume: f64,
    pub unit: String,
}

/// Represents a new vessel to be inserted into the database
#[derive(Insertable, AsChangeset, Debug)]
#[diesel(table_name = vessels)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DBNewVessel<'a> {
    pub name: &'a str,
    pub volume: f64,
    pub unit: &'a str,
}

/// Represents a creator in the database
#[derive(Queryable, Identifiable, AsChangeset, Selectable, Debug)]
#[diesel(table_name = creators)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DBCreator {
    pub id: i32,
    pub given_name: String,
    pub family_name: String,
    pub mail: String,
}

/// Represents a new creator to be inserted into the database
#[derive(Insertable, Debug)]
#[diesel(table_name = creators)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DBNewCreator<'a> {
    pub given_name: &'a str,
    pub family_name: &'a str,
    pub mail: &'a str,
}

/// Represents a kinetic law in the database
#[derive(Queryable, Identifiable, AsChangeset, Selectable, Debug)]
#[diesel(table_name = laws)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DBKineticLaw {
    pub id: i32,
    pub name: String,
    pub equation: String,
}

/// Represents a new kinetic law to be inserted into the database
#[derive(Insertable, Debug)]
#[diesel(table_name = laws)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DBNewKineticLaw<'a> {
    pub name: &'a str,
    pub equation: &'a str,
}

#[derive(Queryable, Selectable, Identifiable, Associations, Debug, PartialEq)]
#[diesel(belongs_to(DBKineticLaw, foreign_key = law_id))]
#[diesel(table_name = laws_parameters)]
pub struct DBLawParameter {
    pub id: i32,
    pub law_id: i32,
    pub parameter_name: String,
}

/// Represents a law-assignable relationship in the database
#[derive(Queryable, Selectable, Identifiable, Associations, Debug, PartialEq)]
#[diesel(belongs_to(DBKineticLaw, foreign_key = law_id))]
#[diesel(table_name = laws_assignables)]
pub struct DBLawAssignable {
    pub id: i32,
    pub law_id: i32,
    pub assignable_name: String,
}

/// Represents a law-species relationship in the database
#[derive(Queryable, Selectable, Identifiable, Associations, Debug, PartialEq)]
#[diesel(belongs_to(DBKineticLaw, foreign_key = law_id))]
#[diesel(table_name = laws_species)]
pub struct DBLawSpecies {
    pub id: i32,
    pub law_id: i32,
    pub species_name: String,
}

// Define converters to convert to the tables
/// Converts an EnzymeML SmallMolecule to a database SmallMolecule
impl From<v2::SmallMolecule> for DBSmallMolecule {
    fn from(value: v2::SmallMolecule) -> Self {
        let references = if !value.references.is_empty() {
            Some(value.references.join(","))
        } else {
            None
        };

        DBSmallMolecule {
            id: 0,
            name: value.name.clone(),
            canonical_smiles: value.canonical_smiles.map(String::from),
            inchi: value.inchi.map(String::from),
            inchikey: value.inchikey.map(String::from),
            references,
        }
    }
}

/// Converts an EnzymeML Protein to a database Protein
impl From<v2::Protein> for DBProtein {
    fn from(value: v2::Protein) -> Self {
        DBProtein {
            id: 0,
            name: value.name.clone(),
            sequence: value.sequence.map(String::from),
            ecnumber: value.ecnumber.map(String::from),
            organism: value.organism.map(String::from),
            organism_tax_id: value.organism_tax_id.map(String::from),
        }
    }
}

/// Converts an EnzymeML Vessel to a database Vessel
impl From<v2::Vessel> for DBVessel {
    fn from(value: v2::Vessel) -> Self {
        DBVessel {
            id: 0,
            name: value.name.clone(),
            volume: value.volume as f64,
            unit: value.unit.name.clone().unwrap_or_default(),
        }
    }
}

/// Converts an EnzymeML Creator to a database Creator
impl From<v2::Creator> for DBCreator {
    fn from(value: v2::Creator) -> Self {
        DBCreator {
            id: 0,
            given_name: value.given_name.clone(),
            family_name: value.family_name.clone(),
            mail: value.mail.clone(),
        }
    }
}

// Conversion to new types
/// Converts an EnzymeML SmallMolecule reference to a new database SmallMolecule
impl<'a> From<&'a v2::SmallMolecule> for DBNewSmallMolecule<'a> {
    fn from(value: &'a v2::SmallMolecule) -> Self {
        let references = if !value.references.is_empty() {
            Some(value.references.join(","))
        } else {
            None
        };

        DBNewSmallMolecule {
            name: &value.name,
            canonical_smiles: value.canonical_smiles.as_deref(),
            inchi: value.inchi.as_deref(),
            inchikey: value.inchikey.as_deref(),
            references,
        }
    }
}

/// Converts an EnzymeML Protein reference to a new database Protein
impl<'a> From<&'a v2::Protein> for DBNewProtein<'a> {
    fn from(value: &'a v2::Protein) -> Self {
        DBNewProtein {
            name: &value.name,
            sequence: value.sequence.as_deref(),
            ecnumber: value.ecnumber.as_deref(),
            organism: value.organism.as_deref(),
            organism_tax_id: value.organism_tax_id.as_deref(),
        }
    }
}

/// Converts an EnzymeML Vessel reference to a new database Vessel
impl<'a> From<&'a v2::Vessel> for DBNewVessel<'a> {
    fn from(value: &'a v2::Vessel) -> Self {
        DBNewVessel {
            name: &value.name,
            volume: value.volume as f64,
            unit: value.unit.name.as_deref().unwrap_or_default(),
        }
    }
}

/// Converts an EnzymeML Creator reference to a new database Creator
impl<'a> From<&'a v2::Creator> for DBNewCreator<'a> {
    fn from(value: &'a v2::Creator) -> Self {
        DBNewCreator {
            given_name: &value.given_name,
            family_name: &value.family_name,
            mail: &value.mail,
        }
    }
}
