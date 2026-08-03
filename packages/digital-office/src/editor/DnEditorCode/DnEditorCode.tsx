import * as React from 'react';
import { useTheme } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import type { Ace } from 'ace-builds';
import ace from 'ace-builds/src-noconflict/ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/snippets/javascript';
import 'ace-builds/src-noconflict/snippets/html';
import 'ace-builds/src-noconflict/snippets/css';
import 'ace-builds/src-noconflict/snippets/json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github_light_default';
import 'ace-builds/src-noconflict/ext-language_tools';
import { EditorFrame } from '../EditorFrame';
import { formatCode, validateCode } from '../format';
import type { DnEditorBaseProps, DnEditorLanguage, DnEditorTemplateVariable } from '../types';
import { aceOptions, resolveEditorLanguage, resolveEditorTheme } from './ace';
import { type EditorPlugin, jsonldPlugin, templatePlugin } from './plugins';
import { useEditorAutocompleteTriggers } from './useEditorAutocompleteTriggers';
import { useEditorCompleters } from './useEditorCompleters';
import { useEditorMarkers } from './useEditorMarkers';
import { useHoverErrorTooltip } from './useHoverErrorTooltip';

export interface DnEditorCodeProps extends DnEditorBaseProps {
    language: DnEditorLanguage;
    templateVariables?: DnEditorTemplateVariable[];
    placeholder?: string;
}

export function DnEditorCode({
    value,
    onChange,
    language,
    disabled,
    error,
    sx,
    templateVariables,
    placeholder,
    getInitialScrollTop,
    onScrollTopChange,
}: DnEditorCodeProps) {
    const theme = useTheme();

    const containerRef = React.useRef<HTMLDivElement>(null);
    const [editor, setEditor] = React.useState<Ace.Editor | null>(null);

    const onChangeRef = React.useRef(onChange);
    const onScrollTopChangeRef = React.useRef(onScrollTopChange);
    const formatRef = React.useRef<() => Promise<void>>(async () => void 0);

    const plugins = React.useMemo<EditorPlugin[]>(() => {
        const result: EditorPlugin[] = [];
        if (language === 'jsonld') result.push(jsonldPlugin);
        if (templateVariables && templateVariables.length > 0) result.push(templatePlugin(templateVariables));
        return result;
    }, [language, templateVariables]);

    React.useEffect(() => {
        if (!editor) return;
        resolveEditorLanguage(editor, language);
    }, [editor, language]);

    React.useEffect(() => {
        if (!editor) return;
        resolveEditorTheme(editor, theme);
    }, [editor, theme]);

    React.useEffect(() => {
        if (!editor) return;
        editor.setOption('placeholder', placeholder ?? '');
    }, [editor, placeholder]);

    // State hydration
    React.useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    React.useEffect(() => {
        onScrollTopChangeRef.current = onScrollTopChange;
    }, [onScrollTopChange]);

    React.useEffect(() => {
        if (!editor || editor.getValue() === value) return;
        editor.setValue(value, 1);
    }, [editor, value]);

    // Formatter hydration
    React.useEffect(() => {
        formatRef.current = async () => {
            if (!editor) return;
            const currentValue = editor.getValue();
            if (!currentValue) return;
            const out = await formatCode(currentValue, language);
            if (out === currentValue) return;
            editor.setValue(out, 1);
        };
    }, [editor, language]);

    // Prettier-based annotation validation
    React.useEffect(() => {
        if (!editor) return;
        const timer = window.setTimeout(async () => {
            const annotation = await validateCode(value, language);
            editor.session.setAnnotations(annotation ? [annotation] : []);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [editor, value, language]);

    // Editor lifecycle (mount-once)
    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const ed: Ace.Editor = ace.edit(container);
        ed.setOptions(aceOptions);
        resolveEditorLanguage(ed, language);
        resolveEditorTheme(ed, theme);
        (ed as unknown as { $blockScrolling: number }).$blockScrolling = Infinity;
        ed.setValue(value, 1);
        ed.session.setScrollTop(getInitialScrollTop?.() ?? 0);

        ed.on('change', () => onChangeRef.current(ed.getValue()));
        ed.session.on('changeScrollTop', top => onScrollTopChangeRef.current?.(top));
        ed.on('blur', () => {
            void formatRef.current();
        });
        ed.commands.addCommand({
            name: 'dnCodeEditorFormat',
            bindKey: { win: 'Ctrl-Shift-F', mac: 'Shift-Alt-F' },
            exec: () => void formatRef.current(),
        });

        setEditor(ed);

        return () => {
            ed.destroy();
            setEditor(null);
        };
        // Mount-once; hydration handled by the effects above.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Plugin orchestration
    const markers = useEditorMarkers(editor, value, plugins);
    useEditorCompleters(editor, plugins);
    useEditorAutocompleteTriggers(editor, plugins);
    const hoverError = useHoverErrorTooltip(containerRef, editor, markers);

    return (
        <CodeFrame
            className="DnEditorCode"
            sx={sx}
            data-disabled={disabled || undefined}
            aria-disabled={disabled || undefined}
            data-error={error || undefined}
        >
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            {hoverError && (
                <HoverTooltip style={{ left: hoverError.x + 12, top: hoverError.y + 16 }}>
                    {hoverError.message}
                </HoverTooltip>
            )}
        </CodeFrame>
    );
}

const CodeFrame = styled(EditorFrame)(
    ({ theme }) => css`
        & .ace_editor {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        /* Ace styles the placeholder as arial + scale(0.9) + 10px margin: realign it on the text
           grid, whose own horizontal offset is the renderer padding (4px). */
        & .ace_placeholder {
            font-family: inherit;
            transform: none;
            margin: 0 4px;
        }

        & .dn-jsonld-warning {
            position: absolute;
            background: ${theme.palette.warning.main}33;
            border-bottom: 2px dashed ${theme.palette.warning.main};
            cursor: help;
        }
        & .dn-jsonld-error {
            position: absolute;
            background: ${theme.palette.error.main}33;
            border-bottom: 2px solid ${theme.palette.error.main};
            cursor: help;
        }
        & .dn-template-error {
            position: absolute;
            background: ${theme.palette.error.main}33;
            border-bottom: 2px wavy ${theme.palette.error.main};
            text-decoration: underline wavy ${theme.palette.error.main};
            cursor: help;
        }
    `
);

const HoverTooltip = styled('div')(
    ({ theme }) => css`
        position: fixed;
        background: ${theme.palette.grey[900]};
        color: ${theme.palette.common.white};
        padding: 6px 10px;
        border-radius: ${theme.shape.borderRadius}px;
        font-size: 12px;
        line-height: 1.4;
        max-width: 400px;
        pointer-events: none;
        z-index: ${theme.zIndex.tooltip};
        box-shadow: ${theme.shadows[4]};
        white-space: pre-wrap;
    `
);
