import {VisData} from "../commands/visualisation.ts";
import {LineProps, ResponsiveLine} from "@nivo/line";
import {useEffect, useState} from "react";
import useAppStore from "../stores/appstore.ts";
import {theme} from "antd";
import useVizStore from "../stores/vizstore.ts";

interface LineChartProps {
    data: VisData;
}

interface WindowSize {
    width: number;
    height: number;
}

export default function LineChart(
    {data}: LineChartProps
) {
    // States
    const [parentSize, setParentSize] = useState<WindowSize>({width: 0, height: 0});
    const [chartTheme, setChartTheme] = useState<LineProps["theme"]>({});
    const useLines = useVizStore(state => state.useLines);
    const usePoints = useVizStore(state => state.usePoints);
    const darkMode = useAppStore(state => state.darkMode);

    // Styles
    const {token} = theme.useToken();

    // Effects
    useEffect(() => {
        setParentSize(
            {
                width: window.innerWidth,
                height: window.innerHeight,

            }
        )
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setParentSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


    useEffect(
        () => {
            console.log("Something: ", darkMode)

            if (true === true) {
                const newChartTheme: LineProps["theme"] = {
                    crosshair: {
                        line: {
                            stroke: token.colorText,
                            strokeWidth: 1,
                            strokeDasharray: "2 2"
                        }
                    },
                    legends: {
                        text: {
                            fill: token.colorTextLabel,
                            fontSize: 12,
                            whiteSpace: 'pre-wrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        },
                    },
                    tooltip: {
                        container: {
                            background: token.colorBgContainer,
                            color: token.colorText,
                        }
                    },
                    grid: {
                        line: {
                            stroke: token.colorBorder,
                            strokeWidth: 1,
                            strokeDasharray: "2 2"
                        }
                    },
                    axis: {
                        legend: {
                            text: {
                                fontSize: 18,
                                fill: token.colorText,
                            }
                        },
                        ticks: {
                            text: {
                                fontSize: 14,
                                fill: token.colorText,
                            },
                            line: {
                                stroke: token.colorBorder,
                                strokeWidth: 1,
                            }
                        },
                        domain: {
                            line: {
                                stroke: token.colorBorder,
                                strokeWidth: 1,
                            }
                        }
                    }
                }

                setChartTheme(newChartTheme)

            }

        },
        [darkMode]
    )

    return (
        <div style={{
            width: parentSize.width * 0.8,
            height: parentSize.height * 0.8,
        }}>
            <ResponsiveLine
                // @ts-ignore
                data={data}
                theme={chartTheme}
                lineWidth={useLines ? 1.5 : 0}
                animate={false}
                margin={{top: 30, right: 170, bottom: 110, left: 80}}
                xScale={{type: 'point'}}
                yScale={{
                    type: 'linear',
                    min: 'auto',
                    max: 'auto',
                    reverse: false
                }}
                yFormat=" >-.2f"
                curve="cardinal"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Time',
                    legendOffset: 50,
                    legendPosition: 'middle',
                    truncateTickAt: 0
                }}
                axisLeft={{
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Concentration",
                    legendOffset: -50,
                    legendPosition: 'middle',
                    truncateTickAt: 0
                }}
                enableGridX={true}
                colors={{scheme: 'nivo'}}
                enablePoints={true}
                pointSize={usePoints ? 4 : 0}
                pointColor={{from: 'color', modifiers: []}}
                pointBorderWidth={2}
                pointBorderColor={{from: 'color', modifiers: []}}
                pointLabel="data.yFormatted"
                pointLabelYOffset={-12}
                areaBaselineValue={50}
                enableSlices="x"
                enableTouchCrosshair={true}
                useMesh={true}
                legends={[
                    {
                        anchor: 'top-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: token.colorBorder,
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemBackground: 'rgba(0, 0, 0, .03)',
                                    itemOpacity: 1
                                }
                            }
                        ]
                    }
                ]}
            />
        </div>
    )
}