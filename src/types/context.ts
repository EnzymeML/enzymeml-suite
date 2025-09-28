import { ZodObject, ZodRawShape, ZodLazy } from "zod";
import { GiMolecule } from "react-icons/gi";
import { addSmallMolecules } from "@suite/commands/smallmols";
import { addProteins } from "@suite/commands/proteins";
import { addReactions } from "@suite/commands/reactions";
import { EnzymeMLDocument, EnzymeMLDocumentSchema, Measurement, MeasurementSchema, Protein, ProteinSchema, Reaction, ReactionSchema, SmallMolecule, SmallMoleculeSchema, Vessel, VesselSchema } from "enzymeml";
import { addMeasurements } from "@suite/commands/measurements";
import { AvailablePaths } from "@suite/stores/appstore";
import { addVessels } from "@suite/commands/vessels";

import EnzymeMLLogoMono from '@icons/enzymeml_logo.svg';
import ProteinIcon from "@icons/protein.svg";
import ReactionsIcon from "@icons/reactions1.svg";
import MeasurementIcon from "@icons/measurements.svg";
import VesselsIcon from "@icons/vessels.svg";
import { createDocument } from "@suite/commands/enzmldoc";

/**
 * Context configuration for data extraction functionality.
 * Defines the schema, UI elements, and data handling for each extraction type.
 * 
 * @template T - The data type that will be extracted and processed
 * @template U - The Zod schema type used for validation (either ZodObject or ZodLazy)
 */
export interface ExtractionContext<T, U extends ZodObject<ZodRawShape> | ZodLazy<ZodObject<ZodRawShape>>> {
    /** Human-readable label for the extraction type */
    label: string;
    /** React icon component to display in the UI */
    icon: React.ElementType | string;
    /** Zod schema used to validate extracted data */
    schema: U;
    /** Function to add extracted items to the application state */
    addFunction: (items: T[]) => Promise<void>;
}

/**
 * Map of available extraction contexts for each application path.
 * Each entry defines how data extraction should work for a specific page/collection type.
 * 
 * The map includes:
 * - HOME: Document-level extraction
 * - VESSELS: Vessel extraction and management
 * - SMALL_MOLECULES: Small molecule extraction and management
 * - PROTEINS: Protein extraction and management
 * - REACTIONS: Reaction extraction and management
 * - MEASUREMENTS: Measurement data extraction and management
 */
export const ExtractionContextMap = {
    [AvailablePaths.HOME]: {
        label: "Document",
        icon: EnzymeMLLogoMono,
        schema: EnzymeMLDocumentSchema,
        addFunction: (data: EnzymeMLDocument[]) => createDocument(data[0]),
    } satisfies ExtractionContext<EnzymeMLDocument, typeof EnzymeMLDocumentSchema>,
    [AvailablePaths.VESSELS]: {
        label: "Vessels",
        icon: VesselsIcon,
        schema: VesselSchema,
        addFunction: addVessels,
    } satisfies ExtractionContext<Vessel, typeof VesselSchema>,
    [AvailablePaths.SMALL_MOLECULES]: {
        label: "Small Molecules",
        icon: GiMolecule,
        schema: SmallMoleculeSchema,
        addFunction: addSmallMolecules,
    } satisfies ExtractionContext<SmallMolecule, typeof SmallMoleculeSchema>,
    [AvailablePaths.PROTEINS]: {
        label: "Proteins",
        icon: ProteinIcon,
        schema: ProteinSchema,
        addFunction: addProteins,
    } satisfies ExtractionContext<Protein, typeof ProteinSchema>,
    [AvailablePaths.REACTIONS]: {
        label: "Reactions",
        icon: ReactionsIcon,
        schema: ReactionSchema,
        addFunction: addReactions,
    } satisfies ExtractionContext<Reaction, typeof ReactionSchema>,
    [AvailablePaths.MEASUREMENTS]: {
        label: "Measurements",
        icon: MeasurementIcon,
        schema: MeasurementSchema,
        addFunction: addMeasurements,
    } satisfies ExtractionContext<Measurement, typeof MeasurementSchema>,
} as const;

/**
 * Type that restricts paths to only those that have extraction contexts defined.
 * Used to ensure type safety when working with extraction functionality.
 */
export type ExtractionEnabledPaths = keyof typeof ExtractionContextMap;
