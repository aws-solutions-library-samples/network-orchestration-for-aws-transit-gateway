// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, {useContext, useEffect, useRef, useState} from "react";
import {Button, ButtonDropdown, SpaceBetween} from "@cloudscape-design/components";
import {generateClient} from "aws-amplify/api";
import {getActionItemsFromTransitNetworkOrchestratorTables, getDashboardItemsFromTransitNetworkOrchestratorTables} from "../../graphql/queries";
import {CommonItem} from "../../types/CommonItem";
import {UserContext} from "../../components/context";
import {updateTransitNetworkOrchestratorTable} from "../../graphql/mutation";
import {ActionItemResultTable} from "../../components/table/ApplicationResultTable";
import {columnDefinitions} from "../../components/table/ColumnDefinitions";

const client = generateClient();


const ActionItems = () => {
    const {setBreadCrumb, user} = useContext(UserContext)
    const [actionItems, setActionItems] = useState<CommonItem[]>([])
    const [selectedItems, setSelectedItems] = useState<CommonItem[]>([])
    const [isLoading, setLoading] = useState<boolean>(false)
    const [isActionVisible, setActionVisible] = useState<boolean>(false)
    const actionItemsRef = useRef<CommonItem[]>([])
    const dashboardItemsRef = useRef<CommonItem[]>([])

    const groups = user?.groups || [];

    // Paginate through a Scan-backed query until nextToken is exhausted.
    // Keyed on nextToken (not items.length): a filtered Scan page can return
    // zero matches while still carrying a nextToken for the next page.
    const fetchAllItems = async (query: string, field: string): Promise<CommonItem[]> => {
        const all: CommonItem[] = []
        let nextToken: string | null = null
        do {
            const result: any = await client.graphql({ query, variables: { nextToken } })
            // @ts-ignore
            const page = result['data'][field]
            all.push(...(page['items'] as CommonItem[]))
            nextToken = page['nextToken'] ?? null
        } while (nextToken != null)
        return all
    }

    const loadActionItems = async () => {
        setLoading(true)
        const [items, dashboardItems] = await Promise.all([
            fetchAllItems(getActionItemsFromTransitNetworkOrchestratorTables, 'getActionItemsFromTransitNetworkOrchestratorTables'),
            fetchAllItems(getDashboardItemsFromTransitNetworkOrchestratorTables, 'getDashboardItemsFromTransitNetworkOrchestratorTables')
        ])

        setActionItems(items)
        actionItemsRef.current = items
        dashboardItemsRef.current = dashboardItems

        setLoading(false)
    }

    const onSelectItems = (item: CommonItem[]) => {
        const hasProcessing = item.some((i) => i.Status === 'processing');
        const isVpcWithoutSubnet = item.some((i) =>
            i.TagEventSource === 'vpc' &&
            !actionItemsRef.current.some((ai) => ai.TagEventSource === 'subnet' && ai.VpcId === i.VpcId) &&
            !dashboardItemsRef.current.some((di) => di.TagEventSource === 'subnet' && di.VpcId === i.VpcId)
        );
        setActionVisible(!hasProcessing && !isVpcWithoutSubnet);
        setSelectedItems(item)
    }

    const updateOperation = async (type: string) => {
        if (!selectedItems || selectedItems.length === 0) {
            console.error('No items selected for update operation');
            return;
        }
        if (!user) {
            console.error('No authenticated user');
            return;
        }
        const currentTimeStamp = new Date();
        const UTCTimeStamp = currentTimeStamp.toISOString();

        const input = {
            SubnetId: selectedItems[0].SubnetId,
            Version: "latest",
            Status: "processing",
            UserId: user.username,
            GraphQLTimeStamp: UTCTimeStamp,
            AdminAction: type,
        };

        await client.graphql({
            query: updateTransitNetworkOrchestratorTable,
            variables: {input}
        });

        loadActionItems().catch((error) => {
            console.log(error)
        })
    }

    useEffect(() => {
        setBreadCrumb([])
        loadActionItems().catch((error) => {
            console.log(error)
        })
    }, [setBreadCrumb])

    return <ActionItemResultTable
        title={"Action Items"}
        data={actionItems}
        loading={isLoading}
        actions={
            <SpaceBetween size={"s"} direction="horizontal">
                {isActionVisible && groups.indexOf("AdminGroup") !== -1 &&
                    <ButtonDropdown
                        onItemClick={(e) => {
                            if (e.detail.id === "approve") {
                                updateOperation("accept").catch((_) => {
                                })
                            }

                            if (e.detail.id === "reject") {
                                updateOperation("reject").then((_) => {
                                })
                            }
                        }}
                        items={[
                            {text: "Approve", id: "approve", disabled: false},
                            {text: "Reject", id: "reject", disabled: false},
                        ]}
                    >
                        Action
                    </ButtonDropdown>
                }
                <Button iconName={"refresh"} onClick={() => loadActionItems()}>Refresh</Button>
            </SpaceBetween>
        }
        columnDefinitions={columnDefinitions}
        selectedItems={selectedItems as [any]}
        onItemSelected={onSelectItems}
    />


}

export default ActionItems
