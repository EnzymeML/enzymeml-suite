import { useEffect, useRef, useMemo, useState } from "react";
// @ts-expect-error - SmilesDrawer is not typed
import SmilesDrawer from "smiles-drawer";
import { theme, Popover, Tag, Badge, Typography } from "antd";
import useAppStore from "../../stores/appstore.ts";
import { ReactionElement } from "enzymeml";
import { listSmallMolecules } from "@suite/commands/smallmols.ts";
import { useRouterTauriListener } from "@suite/hooks/useTauriListener.ts";
import { getBadgeColor } from "@suite/components/CardHeader.tsx";

export const WIDTH = 1200;
const HEIGHT = 100;

/**
 * PopoverLabel component that displays an ID badge and name text for use in popovers
 * 
 * @param id - The identifier to display in the badge
 * @param name - The name text to display next to the badge
 * @returns A flex container with a colored badge and typography text
 */
function PopoverLabel({ id, name }: { id: string, name: string }) {
  // States
  const darkMode = useAppStore((s) => s.darkMode);

  return <div className="flex flex-row gap-2 items-center">
    <Badge count={id} size={"small"} color={getBadgeColor(darkMode)} />
    <Typography.Text
      className="text-sm"
      color={"accentColor"}
    >
      {name}
    </Typography.Text>
  </div>
}

interface SVGChildPopover {
  element: Element;
  content: React.ReactNode;
  bounds: DOMRect;
}

interface ReactionDrawerContainerProps {
  smilesStr: string;
  width?: number;
  height?: number;
  aboveText?: string;
  belowText?: string;
  scale?: number;
  className?: string;
  participants?: ReactionElement[];
}

export default function ReactionDrawerContainer({
  className,
  smilesStr,
  width = WIDTH,
  height = HEIGHT,
  aboveText = "",
  belowText = "",
  participants,
}: ReactionDrawerContainerProps) {
  const darkMode = useAppStore((s) => s.darkMode) ? "dark" : "light";
  const { token } = theme.useToken();

  const svgRef = useRef<SVGSVGElement>(null);
  const drawerRef = useRef<SmilesDrawer.ReactionDrawer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [childPopovers, setChildPopovers] = useState<SVGChildPopover[]>([]);
  const [hoveredChild, setHoveredChild] = useState<number | null>(null);
  const [smallMolecules, setSmallMolecules] = useState<[string, string][]>([]);

  // Effects
  useEffect(() => {
    listSmallMolecules().then((smallMolecules) => {
      setSmallMolecules(smallMolecules);
    });
  }, []);

  // Hooks
  useRouterTauriListener("update_small_mols", () => {
    listSmallMolecules().then((smallMolecules) => {
      setSmallMolecules(smallMolecules);
    });
  });

  // Determine the scale based on the length of the smiles string
  // Scale should go down if the smiles string is too long
  const scale = useMemo(() => {
    return Math.min(0.9, 150 / smilesStr.length);
  }, [smilesStr]);


  // Column weights: give reactants/products more space; slightly widen arrow
  const weights = useMemo(
    () => ({
      reactants: 2.0,
      reagents: 2.0,
      products: 2.0,
      arrow: 1.0,
      plus: 0.8,
    }),
    []
  );

  // (Re)create the ReactionDrawer when layout-affecting options change
  useEffect(() => {
    const reactionOptions = { scale, plus: {}, arrow: {} };

    const moleculeOptions = {
      width,
      height,
      padding: 10,
      bondLength: 20,
      debug: false,
      atomVisualization: "default",
    };

    drawerRef.current = new SmilesDrawer.ReactionDrawer(
      reactionOptions,
      moleculeOptions
    );

    return () => {
      drawerRef.current = null;
    };
  }, [width, height, scale]);

  // Function to set up popovers for all SVG children
  const setupChildPopovers = () => {
    if (!svgRef.current || !participants) {
      setChildPopovers([]);
      return;
    }

    const children = Array.from(svgRef.current.children);
    const popovers: SVGChildPopover[] = [];

    let participantIndex = 0;
    children.forEach((child) => {
      if (child.id === 'plus' || child.id === 'arrow' || child.getBoundingClientRect().height === 0) return;

      // Take the next participant in order
      if (participantIndex < participants.length) {
        const participant = participants[participantIndex];
        const smallMolecule = smallMolecules.find(([id]) => id === participant.species_id);

        const content = smallMolecule
          ? <PopoverLabel id={smallMolecule[0]} name={smallMolecule[1]} />
          : <PopoverLabel id={participant.species_id} name={participant.species_id} />;

        popovers.push({
          element: child,
          content,
          bounds: child.getBoundingClientRect(),
        });

        // Style the child to indicate it's interactive (but don't add event listeners here)
        (child as SVGElement).style.opacity = '1.0';

        participantIndex++;
      }
    });

    setChildPopovers(popovers);
  };

  // Parse + draw whenever inputs change
  useEffect(() => {
    if (!smilesStr || !svgRef.current || !drawerRef.current) return;

    // Clear previous frame
    svgRef.current.innerHTML = "";
    setChildPopovers([]); // Clear previous popovers

    SmilesDrawer.parseReaction(
      smilesStr,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (reaction: any) => {
        try {
          drawerRef.current.draw(
            reaction,
            svgRef.current,
            darkMode,   // themeName
            weights,    // column widths
            aboveText,         // textAbove
            belowText          // textBelow
            // infoOnly is false by default
          );

          // Set up popovers after drawing
          setTimeout(() => {
            setupChildPopovers();
          }, 100); // Small delay to ensure SVG is fully rendered

        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Error drawing reaction:", e);
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any) => {
        // eslint-disable-next-line no-console
        console.error("Error parsing reaction SMILES:", err);
      }
    );

    // No cleanup needed since we're not adding event listeners to SVG elements
  }, [smilesStr, darkMode, weights, participants]);

  return (
    <div
      ref={containerRef}
      className={`flex overflow-hidden relative justify-center items-center w-full ${className}`}
      style={{ height: `${height - 30}px` }}
    >
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: token.borderRadiusLG,
          display: "block",
          overflow: "hidden",
        }}
      />

      {/* Render popovers for each SVG child */}
      {childPopovers.map((popover, index) => {
        const svgRect = svgRef.current?.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();

        if (!svgRect || !containerRect) return null;

        // Calculate relative position within the container with padding
        const padding = 10; // px padding around each element
        const relativeLeft = Math.max(0, popover.bounds.left - containerRect.left - padding);
        const relativeTop = Math.max(0, popover.bounds.top - containerRect.top - padding);
        const width = popover.bounds.width + (padding * 2);
        const height = popover.bounds.height + (padding * 2);

        return (
          <Popover
            key={index}
            content={popover.content}
            trigger="hover"
            placement="bottom"
            open={hoveredChild === index}
          >
            <div
              style={{
                position: 'absolute',
                left: relativeLeft,
                top: relativeTop,
                width: width,
                height: height,
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
              onMouseEnter={() => {
                setHoveredChild(index);
                // Highlight the corresponding SVG element
                (popover.element as SVGElement).style.opacity = '1.0';
              }}
              onMouseLeave={() => {
                setHoveredChild(null);
                // Reset SVG element opacity
                (popover.element as SVGElement).style.opacity = '0.96';
              }}
            />
          </Popover>
        );
      })}
    </div>
  );
}