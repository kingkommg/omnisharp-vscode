/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from '../../../src/vscodeAdapter';
import * as protocol from '../../../src/omnisharp/protocol';
import { DocumentSelector, MessageItem, TextDocument, Uri, GlobPattern, ConfigurationChangeEvent, Disposable } from '../../../src/vscodeAdapter';
import { ITelemetryReporter } from '../../../src/observers/TelemetryObserver';
import { MSBuildDiagnosticsMessage } from '../../../src/omnisharp/protocol';
import { OmnisharpServerMsBuildProjectDiagnostics, OmnisharpServerOnError, OmnisharpServerUnresolvedDependencies, WorkspaceInformationUpdated } from '../../../src/omnisharp/loggingEvents';

export const getNullChannel = (): vscode.OutputChannel => {
    let returnChannel: vscode.OutputChannel = {
        name: "",
        append: (value: string) => { },
        appendLine: (value: string) => { },
        clear: () => { },
        show: (preserveFocusOrColumn?: boolean | vscode.ViewColumn, preserveFocus?: boolean) => { },
        hide: () => { },
        dispose: () => { }
    };
    return returnChannel;
};

export const getNullTelemetryReporter = (): ITelemetryReporter => {
    let reporter: ITelemetryReporter = {
        sendTelemetryEvent: (eventName: string, properties?: { [key: string]: string }, measures?: { [key: string]: number }) => { },
        sendTelemetryErrorEvent: (eventName: string, properties?: { [key: string]: string; }, measures?: { [key: string]: number; }, errorProps?: string[]) => { }
    };

    return reporter;
};

export const getWorkspaceConfiguration = (): vscode.WorkspaceConfiguration => {
    let values: { [key: string]: any } = {};

    let configuration: vscode.WorkspaceConfiguration = {
        get<T>(section: string, defaultValue?: T): T | undefined {
            let result = <T>values[section];
            return result ?? defaultValue;
        },
        has: (section: string) => {
            return values[section] !== undefined;
        },
        inspect: () => { throw new Error("Not Implemented"); },
        update: async (section: string, value: any, configurationTarget?: vscode.ConfigurationTarget | boolean) => {
            values[section] = value;
            return Promise.resolve();
        }
    };

    return configuration;
};

export function getOmnisharpMSBuildProjectDiagnosticsEvent(fileName: string, warnings: MSBuildDiagnosticsMessage[], errors: MSBuildDiagnosticsMessage[]): OmnisharpServerMsBuildProjectDiagnostics {
    return new OmnisharpServerMsBuildProjectDiagnostics({
        FileName: fileName,
        Warnings: warnings,
        Errors: errors
    });
}

export function getMSBuildDiagnosticsMessage(logLevel: string,
    fileName: string,
    text: string,
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number): MSBuildDiagnosticsMessage {
    return {
        LogLevel: logLevel,
        FileName: fileName,
        Text: text,
        StartLine: startLine,
        StartColumn: startColumn,
        EndLine: endLine,
        EndColumn: endColumn
    };
}

export function getOmnisharpServerOnErrorEvent(text: string, fileName: string, line: number, column: number): OmnisharpServerOnError {
    return new OmnisharpServerOnError({
        Text: text,
        FileName: fileName,
        Line: line,
        Column: column
    });
}

export function getUnresolvedDependenices(fileName: string): OmnisharpServerUnresolvedDependencies {
    return new OmnisharpServerUnresolvedDependencies({
        UnresolvedDependencies: [],
        FileName: fileName
    });
}

export function getFakeVsCode(): vscode.vscode {
    return {
        commands: {
            executeCommand: <T>(command: string, ...rest: any[]) => {
                throw new Error("Not Implemented");
            }
        },
        languages: {
            match: (selector: DocumentSelector, document: TextDocument) => {
                throw new Error("Not Implemented");
            }
        },
        window: {
            activeTextEditor: undefined,
            showInformationMessage: <T extends MessageItem>(message: string, ...items: T[]) => {
                throw new Error("Not Implemented");
            },
            showWarningMessage: <T extends MessageItem>(message: string, ...items: T[]) => {
                throw new Error("Not Implemented");
            },
            showErrorMessage: (message: string, ...items: string[]) => {
                throw new Error("Not Implemented");
            }
        },
        workspace: {
            getConfiguration: (section?: string, resource?: Uri) => {
                throw new Error("Not Implemented");
            },
            asRelativePath: (pathOrUri: string | Uri, includeWorkspaceFolder?: boolean) => {
                throw new Error("Not Implemented");
            },
            createFileSystemWatcher: (globPattern: GlobPattern, ignoreCreateEvents?: boolean, ignoreChangeEvents?: boolean, ignoreDeleteEvents?: boolean) => {
                throw new Error("Not Implemented");
            },
            onDidChangeConfiguration: (listener: (e: ConfigurationChangeEvent) => any, thisArgs?: any, disposables?: Disposable[]): Disposable => {
                throw new Error("Not Implemented");
            }
        },
        extensions: {
            getExtension: () => {
                throw new Error("Not Implemented");
            },
            all: []
        },
        Uri: {
            parse: () => {
                throw new Error("Not Implemented");
            }
        },
        version: "",
        env: {
            appName: "",
            appRoot: "",
            language: "",
            clipboard: {
                writeText: () => {
                    throw new Error("Not Implemented");
                },
                readText: () => {
                    throw new Error("Not Implemented");
                }
            },
            machineId: "",
            sessionId: "",
            openExternal: () => {
                throw new Error("Not Implemented");
            }
        }
    };
}

export function getMSBuildWorkspaceInformation(msBuildSolutionPath: string, msBuildProjects: protocol.MSBuildProject[]): protocol.MsBuildWorkspaceInformation {
    return {
        SolutionPath: msBuildSolutionPath,
        Projects: msBuildProjects
    };
}

export function getWorkspaceInformationUpdated(MsBuild: protocol.MsBuildWorkspaceInformation | undefined): WorkspaceInformationUpdated {
    return new WorkspaceInformationUpdated({
        MsBuild,
    });
}

export function getVSCodeWithConfig() {
    const vscode = getFakeVsCode();

    const _vscodeConfig = getWorkspaceConfiguration();
    const _omnisharpConfig = getWorkspaceConfiguration();
    const _csharpConfig = getWorkspaceConfiguration();
    const _razorConfig = getWorkspaceConfiguration();

    vscode.workspace.getConfiguration = (section, resource) => {
        if (section === undefined) {
            return _vscodeConfig;
        } else if (section === 'omnisharp') {
            return _omnisharpConfig;
        } else if (section === 'csharp') {
            return _csharpConfig;
        } else if (section === 'razor') {
            return _razorConfig;
        }

        throw new Error(`Unexpected section ${section}`);
    };

    return vscode;
}

export function updateConfig(vscode: vscode.vscode, section: string | undefined, config: string, value: any) {
    const workspaceConfig = vscode.workspace.getConfiguration(section);
    workspaceConfig.update(config, value);
}
