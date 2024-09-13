import React from 'react';
import type {TableColumnsType} from 'antd';
import {Table} from 'antd';
import './style.css';


interface Measurement {
    key: React.ReactNode;
    name: string;
    children?: DataRow[];

    [additionalKey: string]: string | number | DataRow[] | React.ReactNode | undefined;
}

interface DataRow {
    key: React.ReactNode;

    [additionalKey: string]: number | React.ReactNode;
}

const columns: TableColumnsType<Measurement> = [
    {title: 'Name', dataIndex: 'name', key: 'name', width: "30%",},
    {title: 'Time', dataIndex: 't', key: 't',},
    {title: 'Substrate', dataIndex: 's0', key: 's0',},
    {title: 'Product', dataIndex: 's1', key: 's1',},
];

const data: Measurement[] = [
    {
        key: 1,
        name: 'Measurement 1',
        s0: 100.0,
        s1: 0.0,
        children: [
            {key: 11, t: 0, s0: 100.0, s1: 0.0},
            {key: 12, t: 5, s0: 90.0, s1: 10.0},
            {key: 13, t: 10, s0: 80.0, s1: 20.0},
        ],
    },
    {
        key: 2,
        name: 'Measurement 2',
        s0: 200.0,
        s1: 0.0,
        children: [
            {key: 21, t: 0, s0: 200.0, s1: 0.0},
            {key: 22, t: 5, s0: 160.0, s1: 40.0},
            {key: 23, t: 10, s0: 120.0, s1: 80.0},
        ],
    }
];

const Measurement: React.FC = () => {
    return (
        <>
            <Table
                columns={columns}
                dataSource={data}
                rowClassName={(record) => {
                    return record.children ? 'header-row' : '';
                }}
            />
        </>
    );
};

export default Measurement;