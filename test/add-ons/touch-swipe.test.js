import GridAccordion from '../../src/core/grid-accordion.js';
import TouchSwipe from '../../src/add-ons/touch-swipe/touch-swipe.js';
import { basicAccordion } from '../assets/html/html.js';

let accordion;

beforeAll( ()=> {
    document.body.innerHTML = basicAccordion;
});

describe( 'touch swipe add-on', () => {
    beforeAll( () => {
        accordion = new GridAccordion( '.grid-accordion', {
            addOns: [ TouchSwipe ],
            rows: 2,
            columns: 2
        });
    });

    test( 'should add the `ga-grab` class name to the panels', () => {
        expect( accordion.panelsContainerEl.classList.contains( 'ga-grab' ) ).toBe( true );
    });

    test( 'should add the `ga-grabbing` class name to the panels on mouse down', () => {
        accordion.panelsContainerEl.dispatchEvent( new MouseEvent( 'mousedown' ) );

        expect( accordion.panelsContainerEl.classList.contains( 'ga-grabbing' ) ).toBe( true );
    });

    test( 'should add the `ga-swiping` class name to the accordion on mouse move', () => {
        accordion.panelsContainerEl.dispatchEvent( new MouseEvent( 'mousemove' ) );

        expect( accordion.accordionEl.classList.contains( 'ga-swiping' ) ).toBe( true );
    });

    test( 'should remove the `ga-swiping` class on mouse up', () => {
        jest.useFakeTimers();
        document.dispatchEvent( new MouseEvent( 'mouseup' ) );
        jest.runAllTimers();

        expect( accordion.accordionEl.classList.contains( 'ga-swiping' ) ).toBe( false );

        jest.useRealTimers();
    });
});