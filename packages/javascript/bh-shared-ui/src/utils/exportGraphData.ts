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

export const downloadFile = ({ data, fileName, fileType }: { data: any; fileName: string; fileType: string }) => {
    const blob = new Blob([data], { type: fileType });
    // create an anchor tag and dispatch a click event on it to trigger download
    const a = document.createElement('a');
    a.download = fileName;
    a.href = window.URL.createObjectURL(blob);
    const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
    });
    a.dispatchEvent(clickEvent);
    a.remove();
};

export const exportToJson = (data: any) => {
    downloadFile({
        data: JSON.stringify(data),
        fileName: 'bh-graph.json',
        fileType: 'text/json',
    });
};

export const importToJson = (callback: (data: any) => void): void => {
    // 1. Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json'; // Accept .json files and standard JSON MIME type

    // 2. Handle file selection
    input.onchange = (event) => {
        const file = (event.target as HTMLInputElement)?.files?.[0];
        if (!file) {
            console.error('No file selected.');
            // Optionally, provide user feedback
            return;
        }

        // 3. Read the file content
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const fileContent = e.target?.result;
                if (typeof fileContent === 'string') {
                    // 4. Parse the JSON string
                    const jsonData = JSON.parse(fileContent);
                    // 5. Process the imported data (via callback)
                    callback(jsonData);
                } else {
                    console.error('File content is not a string.');
                    // Optionally, provide user feedback
                }
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                // Optionally, provide user feedback about the error (e.g., alert('Invalid JSON file.'))
            }
        };
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            // Optionally, provide user feedback
        };
        reader.readAsText(file); // Read as text
    };

    // Trigger the file selection dialog
    input.click();
};
