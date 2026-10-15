// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {useContext, useEffect, useState} from "react";
import {Button} from "@cloudscape-design/components";
import {getDashboardItemsFromTransitNetworkOrchestratorTables} from "../../graphql/queries";

import {generateClient} from 'aws-amplify/api';
import {UserContext} from "../../components/context";
import {DashboardResultTable } from "../../components/table/ApplicationResultTable";
import { useNavigate} from 'react-router-dom';
import { CommonItem } from "../../types/CommonItem";
import {columnDefinitions} from "../../components/table/ColumnDefinitions";

const client = generateClient();

const Dashboard = () => {

    const {setBreadCrumb} = useContext(UserContext)
    const [isLoading,setLoading] = useState<boolean>(false)
    const navigate = useNavigate();

    const [dashboardItem, setDashboardItem] = useState<CommonItem[]>([])
    const getDashboardItems = async () => {
        setLoading(true)
        setDashboardItem([])
        // Paginate until nextToken is exhausted. Keyed on nextToken (not
        // items.length): a filtered Scan page can return zero matches while
        // still carrying a nextToken for the next page.
        const all: CommonItem[] = []
        let nextToken: string | null = null
        do {
            const result: any = await client.graphql({
                query: getDashboardItemsFromTransitNetworkOrchestratorTables,
                variables: { nextToken }
            })
            // @ts-ignore
            const page = result['data']['getDashboardItemsFromTransitNetworkOrchestratorTables']
            all.push(...(page['items'] as CommonItem[]))
            nextToken = page['nextToken'] ?? null
        } while (nextToken != null)

        setDashboardItem(all);
        setLoading(false);
    }


    useEffect(() => {
        setBreadCrumb([])
        getDashboardItems().catch((e) => {
            console.log(e)
        })
    }, [])

    const onRowClick = (item: CommonItem) => {
        // @ts-ignore
        navigate(`/dashboard/${item.SubnetId}/${item.VpcId}`)
    }


    return <DashboardResultTable
            className={"clickable-table"}
            title={"Dashboard"}
            data={dashboardItem}
            loading={isLoading}
            actions={
                <Button iconName="refresh" onClick={getDashboardItems}>
                    Refresh
                </Button>
            }
            columnDefinitions={columnDefinitions}
            onRowClick={(item) => {
            console.log(item)
                onRowClick(item as CommonItem)
            }}
        />
}

export default Dashboard