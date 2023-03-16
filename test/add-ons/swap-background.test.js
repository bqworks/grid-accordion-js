import GridAccordion from '../../src/core/grid-accordion.js';
import SwapBackground from '../../src/add-ons/swap-background/swap-background.js';
import { swapBackgroundAccordion } from '../assets/html/html.js';

let accordion;

beforeAll( ()=> {
    document.body.innerHTML = swapBackgroundAccordion;
});

describe( 'swap background add-on', () => {
    beforeAll( () => {
        accordion = new GridAccordion( '.grid-accordion', {
            addOns: [ SwapBackground ]
        });
    });

    test( 'should swap the visibility of the background images when the panel opens', () => {
        accordion.openPanel( 0 );

        const openedPanelBackground = accordion.getPanelAt( 0 ).panelEl.getElementsByClassName( 'ga-background-opened' )[0];

        expect( openedPanelBackground.style.visibility ).toBe( 'visible' );
    });
});