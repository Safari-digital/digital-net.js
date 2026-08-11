import * as React from 'react';
import { css, styled } from '@mui/material/styles';
import { DnInput, type DnInputProps } from './DnInput';
import { DN_DATE_INPUT_TYPES, type DnDateFormat, toDateInputValue, toDateInstant } from './utils';

export interface DnInputDateProps extends Omit<
    DnInputProps,
    'type' | 'multiline' | 'rows' | 'minRows' | 'maxRows' | 'max' | 'pattern' | 'value' | 'onChange'
> {
    /** Precision the date is edited at. Everything the format leaves out is filled on the way out. */
    format?: DnDateFormat;
    /**
     * Hour given to a value the format does not ask one for, 0–23. Defaults to midnight, so a
     * day-precision field lands on 00:00 unless told otherwise — noon being the usual answer.
     */
    defaultHour?: number;
    /** Minutes given to a value the format does not ask them for, 0–59. Defaults to the hour sharp. */
    defaultMinutes?: number;
    /** An instant, a Date, or a value already shaped for the input — all three are read as they mean. */
    value?: unknown;
    /** The instant, filled to the format, or null once the field is emptied. */
    onChange?: (_value: string | null) => void;
}

const HOUR_IN_SECONDS = 3600;
const YEAR_INPUT_PROPS = { min: 1, max: 9999, step: 1 };

export function DnInputDate({
    format = 'yyyymmddhhmm',
    defaultHour,
    defaultMinutes,
    value,
    defaultValue,
    onChange,
    onBlur,
    ...props
}: DnInputDateProps) {
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = React.useState(true);

    const defaults = React.useMemo(
        () => ({ hour: defaultHour, minutes: defaultMinutes }),
        [defaultHour, defaultMinutes]
    );
    const inputValue = React.useMemo(() => toDateInputValue(value, format, defaults), [value, format, defaults]);

    React.useEffect(() => {
        const input = wrapperRef.current?.querySelector('input');
        setIsEmpty(!input?.value);
    }, [inputValue, defaultValue]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setIsEmpty(event.target.value === '');
        onChange?.(toDateInstant(event.target.value, format, defaults));
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        setIsEmpty(event.target.value === '');
        onBlur?.(event);
    };

    return (
        <DateWrapper ref={wrapperRef} data-empty={isEmpty}>
            <DnInput
                {...props}
                value={inputValue}
                defaultValue={defaultValue}
                type={DN_DATE_INPUT_TYPES[format]}
                inputProps={resolveInputProps(format, defaultMinutes)}
                onChange={handleChange}
                onBlur={handleBlur}
            />
        </DateWrapper>
    );
}

function resolveInputProps(format: DnDateFormat, defaultMinutes: number | undefined): DnInputProps['inputProps'] {
    // An hour-precision field is still edited through a datetime-local, which always shows minutes.
    // Stepping by the hour keeps its spinner from offering a precision the value will not keep — but
    // only while the minutes stay on the hour, since a stepped input rejects anything off its grid.
    if (format === 'yyyymmddhh') return defaultMinutes ? undefined : { step: HOUR_IN_SECONDS };
    if (format === 'yyyy') return YEAR_INPUT_PROPS;
    return undefined;
}

const DateWrapper = styled('div')(
    ({ theme }) => css`
        width: 100%;

        & .MuiInputBase-input {
            color-scheme: ${theme.palette.mode};
        }

        & .MuiInputBase-input::-webkit-calendar-picker-indicator {
            cursor: pointer;
        }

        & .MuiInputBase-input {
            transition: color 100ms ease-in-out;
        }

        &[data-empty='true'] .MuiInputBase-input:not(:focus) {
            color: transparent;
        }
    `
);
