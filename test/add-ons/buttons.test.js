import GridAccordion from '../../src/core/grid-accordion.js';
import Buttons from '../../src/add-ons/buttons/buttons.js';
import { basicAccordion } from '../assets/html/html.js';

let accordion, accordionEl;

beforeAll( ()=> {
    document.body.innerHTML = basicAccordion;
    accordionEl = document.getElementsByClassName( 'grid-accordion' )[0];
});

describe( 'buttons add-on', () => {
    beforeAll( () => {
        accordion = new GridAccordion( '.grid-accordion', {
            addOns: [ Buttons ],
            rows: 1,
            columns: 1 // set one panel per page, to make it easier to test
        });
    });

    test( 'should setup the buttons', () => {
        const buttonEl = accordionEl.getElementsByClassName( 'ga-pagination-button' );

        expect( buttonEl.length ).toBe( 5 );
    });

    test( 'should adjust the buttons when the number of pages modify', () => {
        let newPanelEl = document.createElement( 'div' );
        newPanelEl.classList.add( 'ga-panel' );
        accordionEl.getElementsByClassName( 'ga-panels' )[0].appendChild( newPanelEl );
        accordion.update();

        const buttonEl = accordionEl.getElementsByClassName( 'ga-pagination-button' );

        expect( buttonEl.length ).toBe( 6 );
    });

    test( 'should navigate to the corresponding page on button click', () => {
        let index = 2;

        const buttonsEl = accordionEl.getElementsByClassName( 'ga-pagination-buttons' )[0];
        const buttonEl = buttonsEl.getElementsByClassName( 'ga-pagination-button' )[ index ];
        
        buttonEl.dispatchEvent( new MouseEvent( 'click' ) );
        
        const finalPanelIndex = accordion.getCurrentPage();

        expect( finalPanelIndex ).toBe( index );
    });

    test( 'should select the corresponding button when a new panel is opened', () => {
        let index = 3;

        const buttonsEl = accordionEl.getElementsByClassName( 'ga-pagination-buttons' )[0];
        const buttonEl = buttonsEl.getElementsByClassName( 'ga-pagination-button' )[ index ];
        
        accordion.gotoPage( index );

        expect( buttonEl.classList.contains( 'ga-selected' ) ).toBe( true );
    });

    test( 'should remove the buttons when the accordion is destroyed', () => {
        accordion.destroy();

        const buttonEl = accordionEl.getElementsByClassName( 'ga-pagination-button' );

        expect( buttonEl.length ).toBe( 0 );
    });
});