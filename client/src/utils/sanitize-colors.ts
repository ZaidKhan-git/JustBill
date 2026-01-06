/**
 * Utility to convert oklab colors to RGB for html2canvas compatibility
 */

export function sanitizeColorsForCapture(element: HTMLElement): void {
    const allElements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[];

    allElements.forEach((el) => {
        const computed = window.getComputedStyle(el);

        // Store original computed color values
        const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor'];

        colorProps.forEach(prop => {
            const value = computed.getPropertyValue(prop);
            if (value && (value.includes('oklab') || value.includes('oklch'))) {
                // Force the browser to compute the final RGB value and apply it inline
                const tempDiv = document.createElement('div');
                tempDiv.style.cssText = `${prop}: ${value};`;
                document.body.appendChild(tempDiv);
                const computedValue = window.getComputedStyle(tempDiv).getPropertyValue(prop);
                document.body.removeChild(tempDiv);

                // Apply as inline style
                el.style.setProperty(prop, computedValue, 'important');
            }
        });
    });
}

export function restoreOriginalStyles(element: HTMLElement): void {
    const allElements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[];

    allElements.forEach((el) => {
        // Remove inline styles we added
        const colorProps = ['color', 'background-color', 'border-color', 'outline-color'];
        colorProps.forEach(prop => {
            el.style.removeProperty(prop);
        });
    });
}
