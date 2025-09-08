// Documents table for storing text-based documents
// Used for managing various types of documentation within the system
diesel::table! {
    documents (id) {
        // Primary key for the document
        id -> Integer,
        // The title or name of the document
        title -> Varchar,
        // The main content/body of the document
        content -> Text,
    }
}

// Proteins table for storing protein/enzyme information
// Contains biological data about proteins including sequences and classification
diesel::table! {
    proteins (id) {
        // Primary key for the protein
        id -> Integer,
        // Name or identifier of the protein
        name -> Varchar,
        // Amino acid sequence of the protein (optional)
        sequence -> Nullable<Text>,
        // EC (Enzyme Commission) number for enzyme classification (optional)
        ecnumber -> Nullable<Varchar>,
        // Organism from which the protein originates (optional)
        organism -> Nullable<Varchar>,
        // Taxonomic ID of the organism (optional)
        organism_tax_id -> Nullable<Varchar>,
    }
}

// Small molecules table for storing chemical compound information
// Contains chemical identifiers and structural data for small molecules
diesel::table! {
    small_molecules (id) {
        // Primary key for the small molecule
        id -> Integer,
        // Name or identifier of the molecule
        name -> Varchar,
        // Canonical SMILES representation of the molecular structure (optional)
        canonical_smiles -> Nullable<Text>,
        // InChI (International Chemical Identifier) string (optional)
        inchi -> Nullable<Text>,
        // InChI Key - hashed version of InChI for easier searching (optional)
        inchikey -> Nullable<Varchar>,
        // Literature or database references for the molecule (optional)
        references -> Nullable<Text>,
    }
}

// Vessels table for storing reaction vessel/container information
// Defines the physical containers where reactions take place
diesel::table! {
    vessels (id) {
        // Primary key for the vessel
        id -> Integer,
        // Name or identifier of the vessel
        name -> Varchar,
        // Volume of the vessel
        volume -> Float8,
        // Unit of measurement for the volume (e.g., mL, L)
        unit -> Varchar,
        // Whether the vessel volume remains constant during reactions
        constant -> Bool,
    }
}

// Creators table for storing information about people who create or contribute to data
// Used for attribution and contact information
diesel::table! {
    creators (id) {
        // Primary key for the creator
        id -> Integer,
        // First name of the creator
        given_name -> Varchar,
        // Last name of the creator
        family_name -> Varchar,
        // Email address of the creator
        mail -> Varchar,
    }
}

// Laws table for storing kinetic law definitions
// Contains the mathematical equations and metadata for kinetic laws used in reactions
diesel::table! {
    laws (id) {
        // Primary key for the kinetic law
        id -> Integer,
        // Name or identifier of the kinetic law
        name -> Varchar,
        // Mathematical equation representing the kinetic law
        equation -> Text,
    }
}

// Junction table linking kinetic laws to the species they involve
// Defines which chemical species participate in each kinetic law and their roles
diesel::table! {
    laws_species (id) {
        // Primary key for the law-species relationship
        id -> Integer,
        // Foreign key referencing the kinetic law
        law_id -> Integer,
        // Name of the species
        species_name -> Varchar,
        // Role of the species in the reaction (e.g., substrate, product, enzyme, inhibitor)
        role -> Varchar,
    }
}

// Junction table linking kinetic laws to assignable entities
// Connects laws to entities that can be assigned values (continuous or discrete)
diesel::table! {
    laws_assignables (id) {
        // Primary key for the law-assignable relationship
        id -> Integer,
        // Foreign key referencing the kinetic law
        law_id -> Integer,
        // Name of the assignable entity
        assignable_name -> Varchar,
        // Type of assignable entity - can be continuous or discrete
        assignable_type -> Varchar,
    }
}

// Junction table linking kinetic laws to their parameters
// Defines which parameters are associated with each kinetic law
diesel::table! {
    laws_parameters (id) {
        // Primary key for the law-parameter relationship
        id -> Integer,
        // Foreign key referencing the kinetic law
        law_id -> Integer,
        // Name of the parameter
        parameter_name -> Varchar,
    }
}

// Joins between law tables
diesel::joinable!(laws -> laws_assignables (id));
diesel::joinable!(laws -> laws_parameters (id));
diesel::joinable!(laws -> laws_species (id));

// Allow tables to appear in the same query
diesel::allow_tables_to_appear_in_same_query!(
    laws,
    laws_assignables,
    laws_parameters,
    laws_species,
);
