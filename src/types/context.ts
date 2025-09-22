import { ZodObject, ZodRawShape } from "zod";
import { GiMolecule } from "react-icons/gi";
import { SmallMoleculeSchema } from "enzymeml";

export enum ExtractionContextEnum {
    SMALL_MOLECULES = "Molecules",
    COMPLEXES = "Complexes",
    PROTEINS = "Proteins",
    REACTIONS = "Reactions",
    MEASUREMENTS = "Measurements",
}

export interface ExtractionContext {
    label: string;
    icon: React.ElementType;
    schema: ZodObject<ZodRawShape>;
}

export const ExtractionContexts: { [key in ExtractionContextEnum]: ExtractionContext } = {
    [ExtractionContextEnum.SMALL_MOLECULES]: {
        label: ExtractionContextEnum.SMALL_MOLECULES,
        icon: GiMolecule,
        schema: SmallMoleculeSchema as unknown as ZodObject<ZodRawShape>,
    },
    [ExtractionContextEnum.COMPLEXES]: {
        label: ExtractionContextEnum.COMPLEXES,
        icon: GiMolecule, // You'll need to import appropriate icons for other types
        schema: SmallMoleculeSchema as unknown as ZodObject<ZodRawShape>, // Replace with appropriate schema
    },
    [ExtractionContextEnum.PROTEINS]: {
        label: ExtractionContextEnum.PROTEINS,
        icon: GiMolecule,
        schema: SmallMoleculeSchema as unknown as ZodObject<ZodRawShape>,
    },
    [ExtractionContextEnum.REACTIONS]: {
        label: ExtractionContextEnum.REACTIONS,
        icon: GiMolecule,
        schema: SmallMoleculeSchema as unknown as ZodObject<ZodRawShape>,
    },
    [ExtractionContextEnum.MEASUREMENTS]: {
        label: ExtractionContextEnum.MEASUREMENTS,
        icon: GiMolecule,
        schema: SmallMoleculeSchema as unknown as ZodObject<ZodRawShape>,
    },
};
