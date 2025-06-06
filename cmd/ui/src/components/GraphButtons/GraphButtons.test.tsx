// Copyright 2023 Specter Ops, Inc.
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

import { SigmaContainer } from '@react-sigma/core';
import userEvent from '@testing-library/user-event';
import GraphButtons from 'src/components/GraphButtons';
import { render, screen } from 'src/test-utils';

describe('GraphLayoutButtons', () => {
    const user = userEvent.setup();

    it('should render', () => {
        const testOnReset = vi.fn();
        const testOnRunStandardLayout = vi.fn();
        const testOnRunSequentialLayout = vi.fn();
        const testOnExportJson = vi.fn();
        const testOnImportJson = vi.fn();
        const testOnSearchCurrentResults = vi.fn();
        const testOnToggleAllLabels = vi.fn();
        const testOnToggleNodeLabels = vi.fn();
        const testOnToggleEdgeLabels = vi.fn();
        const testShowNodeLabels = true;
        const testShowEdgeLabels = true;
        const testIsCurrentSearchOpen = false;
        const isJsonExportDisabled = true;
        render(
            <SigmaContainer>
                <GraphButtons
                    onReset={testOnReset}
                    onRunStandardLayout={testOnRunStandardLayout}
                    onRunSequentialLayout={testOnRunSequentialLayout}
                    onExportJson={testOnExportJson}
                    onImportJson={testOnImportJson}
                    onSearchCurrentResults={testOnSearchCurrentResults}
                    onToggleAllLabels={testOnToggleAllLabels}
                    onToggleNodeLabels={testOnToggleNodeLabels}
                    onToggleEdgeLabels={testOnToggleEdgeLabels}
                    showNodeLabels={testShowNodeLabels}
                    showEdgeLabels={testShowEdgeLabels}
                    isCurrentSearchOpen={testIsCurrentSearchOpen}
                    isJsonExportDisabled={isJsonExportDisabled}
                />
            </SigmaContainer>
        );

        const layoutButton = screen.getByRole('button', { name: /layout/i });
        expect(layoutButton).toBeInTheDocument();

        const exportButton = screen.getByRole('button', { name: /export/i });
        expect(exportButton).toBeInTheDocument();
    });

    it('interacting with any menu item closes the menu', async () => {
        const testOnReset = vi.fn();
        const testOnRunStandardLayout = vi.fn();
        const testOnRunSequentialLayout = vi.fn();
        const testOnExportJson = vi.fn();
        const testOnImportJson = vi.fn();
        const testOnSearchCurrentResults = vi.fn();
        const testOnToggleAllLabels = vi.fn();
        const testOnToggleNodeLabels = vi.fn();
        const testOnToggleEdgeLabels = vi.fn();
        const testShowNodeLabels = true;
        const testShowEdgeLabels = true;
        const testIsCurrentSearchOpen = false;
        const isJsonExportDisabled = true;
        render(
            <SigmaContainer>
                <GraphButtons
                    onReset={testOnReset}
                    onRunStandardLayout={testOnRunStandardLayout}
                    onRunSequentialLayout={testOnRunSequentialLayout}
                    onExportJson={testOnExportJson}
                    onImportJson={testOnImportJson}
                    onSearchCurrentResults={testOnSearchCurrentResults}
                    onToggleAllLabels={testOnToggleAllLabels}
                    onToggleNodeLabels={testOnToggleNodeLabels}
                    onToggleEdgeLabels={testOnToggleEdgeLabels}
                    showNodeLabels={testShowNodeLabels}
                    showEdgeLabels={testShowEdgeLabels}
                    isCurrentSearchOpen={testIsCurrentSearchOpen}
                    isJsonExportDisabled={isJsonExportDisabled}
                />
            </SigmaContainer>
        );

        const layoutButton = screen.getByRole('button', { name: /layout/i });
        expect(layoutButton).toBeInTheDocument();

        await user.click(layoutButton);

        const menuItem = screen.getByRole('menuitem', { name: /sequential/i });
        expect(menuItem).toBeInTheDocument();

        await userEvent.click(menuItem);
        expect(menuItem).not.toBeInTheDocument();
    });

    it('export action is disabled if the canvas is empty', async () => {
        const testOnReset = vi.fn();
        const testOnRunStandardLayout = vi.fn();
        const testOnRunSequentialLayout = vi.fn();
        const testOnExportJson = vi.fn();
        const testOnImportJson = vi.fn();
        const testOnSearchCurrentResults = vi.fn();
        const testOnToggleAllLabels = vi.fn();
        const testOnToggleNodeLabels = vi.fn();
        const testOnToggleEdgeLabels = vi.fn();
        const testShowNodeLabels = true;
        const testShowEdgeLabels = true;
        const testIsCurrentSearchOpen = false;
        const isJsonExportDisabled = true; // We assume that there is no data so the prop evaluated to true as it checks if value isEmpty
        render(
            <SigmaContainer>
                <GraphButtons
                    onReset={testOnReset}
                    onRunStandardLayout={testOnRunStandardLayout}
                    onRunSequentialLayout={testOnRunSequentialLayout}
                    onExportJson={testOnExportJson}
                    onImportJson={testOnImportJson}
                    onSearchCurrentResults={testOnSearchCurrentResults}
                    onToggleAllLabels={testOnToggleAllLabels}
                    onToggleNodeLabels={testOnToggleNodeLabels}
                    onToggleEdgeLabels={testOnToggleEdgeLabels}
                    showNodeLabels={testShowNodeLabels}
                    showEdgeLabels={testShowEdgeLabels}
                    isCurrentSearchOpen={testIsCurrentSearchOpen}
                    isJsonExportDisabled={isJsonExportDisabled}
                />
            </SigmaContainer>
        );

        const exportButton = screen.getByRole('button', { name: /export/i });
        expect(exportButton).toBeInTheDocument();

        await user.click(exportButton);

        const jsonMenuItem = screen.getByRole('menuitem', { name: /json/i });
        expect(jsonMenuItem).toHaveAttribute('aria-disabled');
    });

    it('export action is enabled if the there is graph data saved', async () => {
        const testOnReset = vi.fn();
        const testOnRunStandardLayout = vi.fn();
        const testOnRunSequentialLayout = vi.fn();
        const testOnExportJson = vi.fn();
        const testOnImportJson = vi.fn();
        const testOnSearchCurrentResults = vi.fn();
        const testOnToggleAllLabels = vi.fn();
        const testOnToggleNodeLabels = vi.fn();
        const testOnToggleEdgeLabels = vi.fn();
        const testShowNodeLabels = true;
        const testShowEdgeLabels = true;
        const testIsCurrentSearchOpen = false;
        const isJsonExportDisabled = false; // We assume that there is data as the prop evaluated to false as it checks if value isEmpty
        render(
            <SigmaContainer>
                <GraphButtons
                    onReset={testOnReset}
                    onRunStandardLayout={testOnRunStandardLayout}
                    onRunSequentialLayout={testOnRunSequentialLayout}
                    onExportJson={testOnExportJson}
                    onImportJson={testOnImportJson}
                    onSearchCurrentResults={testOnSearchCurrentResults}
                    onToggleAllLabels={testOnToggleAllLabels}
                    onToggleNodeLabels={testOnToggleNodeLabels}
                    onToggleEdgeLabels={testOnToggleEdgeLabels}
                    showNodeLabels={testShowNodeLabels}
                    showEdgeLabels={testShowEdgeLabels}
                    isCurrentSearchOpen={testIsCurrentSearchOpen}
                    isJsonExportDisabled={isJsonExportDisabled}
                />
            </SigmaContainer>
        );

        const exportButton = screen.getByRole('button', { name: /export/i });
        expect(exportButton).toBeInTheDocument();

        await user.click(exportButton);

        const jsonMenuItem = screen.getByRole('menuitem', { name: /json/i });
        expect(jsonMenuItem).not.toHaveAttribute('aria-disabled');
    });
});
