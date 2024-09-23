import Latex from 'react-latex-next'
import 'katex/dist/katex.css'
import {EquationDisplayProps} from "../ReactionForm.tsx";
import {useEffect, useState} from "react";
import {getSpeciesNameByID} from "../../commands/enzmldoc.ts";
import {abs} from "mathjs";
import {ReactionElement} from "enzymeml/src";

const prepareElementString = async (reactionElement: ReactionElement) => {
    const speciesName = await getSpeciesNameByID(reactionElement.species_id)

    if (abs(reactionElement.stoichiometry) === 1) {
        return speciesName
    }

    return `${abs(reactionElement.stoichiometry)} \\: ${speciesName}`
}

export default function ChemicalReaction(
    {
        reactants,
        products,
        isReversible,
    }: EquationDisplayProps
) {
    // States
    const [reactantNames, setReactantNames] = useState<string>("")
    const [productNames, setProductNames] = useState<string>("")

    // Effects
    useEffect(() => {
        // Fetch the names of the reactants using the async getSpeciesNameByID function
        const fetchReactantNames = async () => {
            const names = await Promise.all(
                reactants.map(async (reactionElement) => {
                        return await prepareElementString(reactionElement)
                    }
                ))
            setReactantNames(names.join(' + '))
        }

        // Fetch the names of the products using the async getSpeciesNameByID function
        const fetchProductNames = async () => {
            const names = await Promise.all(
                products.map(async (reactionElement) => {
                        return await prepareElementString(reactionElement)
                    }
                ))
            setProductNames(names.join(' + '))
        }

        fetchReactantNames().catch((error) => console.error("Error fetching reactant names:", error))
        fetchProductNames().catch((error) => console.error("Error fetching product names:", error))
    }, [reactants, products]);

    console.log(reactantNames, productNames)

    const arrow = isReversible ? '\\rightleftharpoons' : '\\rightarrow'

    const equation = `$$ \\large ${reactantNames} \\; ${arrow} \\; ${productNames}$$`

    return <Latex>{equation}</Latex>
}