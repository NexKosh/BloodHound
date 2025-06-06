// Copyright 2024 Specter Ops, Inc.
//
// Licensed under the Apache License, Version 2.0
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// SPDX-License-Identifier: Apache-2.0

import { Button } from '@bloodhoundenterprise/doodleui';
import { Alert, Box, Checkbox, FormControl, FormControlLabel, FormGroup, Typography } from '@mui/material';
import {
    DeleteConfirmationDialog,
    FeatureFlag,
    PageWithTitle,
    Permission,
    apiClient,
    useMountEffect,
    useNotifications,
    usePermissions,
} from 'bh-shared-ui';
import { ClearDatabaseRequest } from 'js-client-library';
import { FC, useReducer } from 'react';
import { useMutation } from 'react-query';
import { useSelector } from 'react-redux';
import { selectAllAssetGroupIds, selectTierZeroAssetGroupId } from 'src/ducks/assetgroups/reducer';

const initialState: State = {
    deleteCollectedGraphData: false,
    deleteCustomHighValueSelectors: false,
    deleteAllAssetGroupSelectors: false,
    deleteFileIngestHistory: false,
    deleteDataQualityHistory: false,

    noSelectionError: false,
    mutationError: false,
    showSuccessMessage: false,

    openDialog: false,
};

type State = {
    // checkbox state
    deleteCollectedGraphData: boolean;
    deleteCustomHighValueSelectors: boolean;
    deleteAllAssetGroupSelectors: boolean;
    deleteFileIngestHistory: boolean;
    deleteDataQualityHistory: boolean;

    // error state
    noSelectionError: boolean;
    mutationError: boolean;
    mutationErrorMessage?: string;
    showSuccessMessage: boolean;

    // modal state
    openDialog: boolean;
};

type Action =
    | { type: 'no_selection_error' }
    | { type: 'mutation_error'; message?: string }
    | { type: 'mutation_success' }
    | { type: 'selection'; targetName: string; checked: boolean }
    | { type: 'open_dialog' }
    | { type: 'close_dialog' };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'no_selection_error': {
            return {
                ...state,
                noSelectionError: true,
                mutationError: false,
            };
        }
        case 'mutation_error': {
            return {
                ...state,
                mutationError: true,
                noSelectionError: false,
                mutationErrorMessage: action.message,
            };
        }
        case 'mutation_success': {
            return {
                ...state,
                // reset checkboxes
                deleteCollectedGraphData: false,
                deleteCustomHighValueSelectors: false,
                deleteAllAssetGroupSelectors: false,
                deleteDataQualityHistory: false,
                deleteFileIngestHistory: false,

                showSuccessMessage: true,
            };
        }
        case 'selection': {
            const { targetName, checked } = action;
            return {
                ...state,
                [targetName]: checked,
                noSelectionError: false,
            };
        }
        case 'open_dialog': {
            const noSelection =
                [
                    state.deleteCollectedGraphData,
                    state.deleteDataQualityHistory,
                    state.deleteFileIngestHistory,
                    state.deleteAllAssetGroupSelectors,
                    state.deleteCustomHighValueSelectors,
                ].filter(Boolean).length === 0;

            if (noSelection) {
                return {
                    ...state,
                    noSelectionError: true,
                };
            } else {
                return {
                    ...state,
                    noSelectionError: false,
                    openDialog: true,
                };
            }
        }
        case 'close_dialog': {
            return {
                ...state,
                openDialog: false,
            };
        }
        default: {
            return state;
        }
    }
};

const useDatabaseManagement = () => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const allAssetGroupIds = useSelector(selectAllAssetGroupIds);
    const highValueAssetGroupId = useSelector(selectTierZeroAssetGroupId);

    const {
        deleteCollectedGraphData,
        deleteCustomHighValueSelectors,
        deleteAllAssetGroupSelectors,
        deleteFileIngestHistory,
        deleteDataQualityHistory,
    } = state;

    const mutation = useMutation({
        mutationFn: async ({ deleteThisData }: { deleteThisData: ClearDatabaseRequest }) => {
            return apiClient.clearDatabase({
                ...deleteThisData,
            });
        },
        onError: (error: any) => {
            // show UI message that data deletion failed
            if (error?.response?.status === 500 && error?.response?.data?.errors?.length > 0) {
                const message = error?.response?.data?.errors?.[0].message;
                dispatch({ type: 'mutation_error', message });
            } else {
                dispatch({ type: 'mutation_error' });
            }
        },
        onSuccess: () => {
            // show UI message that data deletion is happening
            dispatch({ type: 'mutation_success' });
        },
    });

    const handleMutation = () => {
        const assetGroupIds = [];

        if (deleteAllAssetGroupSelectors) {
            assetGroupIds.push(...allAssetGroupIds);
        } else if (deleteCustomHighValueSelectors) {
            assetGroupIds.push(highValueAssetGroupId);
        }

        // dedupe high value asset group id if both checkboxes are selected
        const dedupe = (arr: number[]): number[] => {
            return arr.filter((value, index) => arr.indexOf(value) === index);
        };

        const deleteAssetGroupSelectors = dedupe(assetGroupIds);

        mutation.mutate({
            deleteThisData: {
                deleteCollectedGraphData,
                deleteDataQualityHistory,
                deleteFileIngestHistory,
                deleteAssetGroupSelectors,
            },
        });
    };

    return { handleMutation, state, dispatch };
};

const DatabaseManagement: FC = () => {
    const { handleMutation, state, dispatch } = useDatabaseManagement();
    const { checkPermission } = usePermissions();
    const hasPermission = checkPermission(Permission.WIPE_DB);

    const { addNotification, dismissNotification } = useNotifications();
    const notificationKey = 'database-management-permission';

    const effect: React.EffectCallback = () => {
        if (!hasPermission) {
            addNotification(
                `Your user role does not allow managing the database. Please contact your administrator for details.`,
                notificationKey,
                {
                    persist: true,
                    anchorOrigin: { vertical: 'top', horizontal: 'right' },
                }
            );
        }

        return () => dismissNotification(notificationKey);
    };

    useMountEffect(effect);

    const {
        deleteCollectedGraphData,
        deleteAllAssetGroupSelectors,
        deleteCustomHighValueSelectors,
        deleteFileIngestHistory,
        deleteDataQualityHistory,
    } = state;

    const handleCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({
            type: 'selection',
            targetName: event.target.name,
            checked: event.target.checked,
        });
    };

    return (
        <PageWithTitle
            title='Database Management'
            data-testid='database-management'
            pageDescription={
                <Typography variant='body2' paragraph>
                    Manage your BloodHound data. Select from the options below which data should be deleted.
                </Typography>
            }>
            <Box>
                <Alert severity='warning' sx={{ mt: '1rem' }}>
                    <strong>Caution: </strong> This change is irreversible and will delete data from your environment.
                </Alert>

                <Box display='flex' flexDirection='column' alignItems='start'>
                    <FormControl
                        variant='standard'
                        sx={{ paddingBlock: 2 }}
                        error={state.noSelectionError || state.mutationError}>
                        {state.noSelectionError ? <Alert severity='error'>Please make a selection.</Alert> : null}
                        {state.mutationError ? (
                            <Alert severity='error'>
                                {state.mutationErrorMessage
                                    ? state.mutationErrorMessage
                                    : 'There was an error processing your request.'}
                            </Alert>
                        ) : null}
                        {state.showSuccessMessage ? (
                            <Alert severity='info'>
                                Deletion of the data is under way. Depending on data volume, this may take some time to
                                complete.
                            </Alert>
                        ) : null}

                        <FormGroup sx={{ paddingTop: 1 }}>
                            <FeatureFlag
                                flagKey='clear_graph_data'
                                enabled={
                                    <FormControlLabel
                                        label='Collected graph data (all nodes and edges)'
                                        control={
                                            <Checkbox
                                                checked={deleteCollectedGraphData}
                                                onChange={handleCheckbox}
                                                name='deleteCollectedGraphData'
                                                disabled={!hasPermission}
                                            />
                                        }
                                    />
                                }
                            />
                            <FormControlLabel
                                label='Custom High Value selectors'
                                control={
                                    <Checkbox
                                        checked={deleteCustomHighValueSelectors}
                                        onChange={handleCheckbox}
                                        name='deleteCustomHighValueSelectors'
                                        disabled={!hasPermission}
                                    />
                                }
                            />
                            <FormControlLabel
                                label='All asset group selectors'
                                control={
                                    <Checkbox
                                        checked={deleteAllAssetGroupSelectors}
                                        onChange={handleCheckbox}
                                        name='deleteAllAssetGroupSelectors'
                                        disabled={!hasPermission}
                                    />
                                }
                            />
                            <FormControlLabel
                                label='File ingest log history'
                                control={
                                    <Checkbox
                                        checked={deleteFileIngestHistory}
                                        onChange={handleCheckbox}
                                        name='deleteFileIngestHistory'
                                        disabled={!hasPermission}
                                    />
                                }
                            />
                            <FormControlLabel
                                label='Data quality history'
                                control={
                                    <Checkbox
                                        checked={deleteDataQualityHistory}
                                        onChange={handleCheckbox}
                                        name='deleteDataQualityHistory'
                                        disabled={!hasPermission}
                                    />
                                }
                            />
                        </FormGroup>
                    </FormControl>

                    <Button disabled={!hasPermission} onClick={() => dispatch({ type: 'open_dialog' })}>
                        Delete
                    </Button>
                </Box>
            </Box>

            <DeleteConfirmationDialog
                open={state.openDialog}
                onCancel={() => {
                    dispatch({ type: 'close_dialog' });
                }}
                onConfirm={() => {
                    dispatch({ type: 'close_dialog' });
                    handleMutation();
                }}
                itemName='data from the current environment'
                itemType='environment data'
            />
        </PageWithTitle>
    );
};

export default DatabaseManagement;
