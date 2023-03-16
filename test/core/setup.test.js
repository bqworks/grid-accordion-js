import GridAccordion from '../../src/core/grid-accordion.js';
import { basicAccordion } from '../assets/html/html.js';

let accordion, accordionEl;

beforeAll( ()=> {
    document.body.innerHTML = basicAccordion;
    accordionEl = document.getElementsByClassName( 'grid-accordion' )[0];
});

describe( 'accordion setup', () => {
    beforeAll( () => {
        accordion = new GridAccordion( '.grid-accordion' );
    });

    afterAll( () => {
        accordion.destroy();
    });

    test( 'should have the ga-no-js class removed', () => {
        expect( accordionEl.classList.contains( 'ga-no-js' ) ).toBe( false );
    });

    test( 'should have the correct number of panels', () => {
        expect( accordion.getTotalPanels() ).toBe( 5 );
    });

    test( 'should have the correct panel order', () => {
        const expectedPanelOrder = ['1', '2', '3', '4', '5'];
        const actualPanelOrder = [];

        for ( let i = 0; i < accordion.getTotalPanels(); i++ ) {
            actualPanelOrder.push( accordion.getPanelAt( i ).panelEl.textContent );
        }

        expect( actualPanelOrder ).toEqual( expectedPanelOrder );
    });

    test( 'should return the correct initial selected panel index', () => {
        expect( accordion.getCurrentIndex() ).toBe( -1 );
    });

    test( 'should return the correct panel when retrieving by index', () => {
        for ( let i = 0; i < accordion.getTotalPanels(); i++ ) {
            expect( accordion.getPanelAt( i ).index ).toBe( i );
        }
    });
});

describe( 'accordion shuffle', () => {
    beforeAll( () => {
        accordion = new GridAccordion( '.grid-accordion', { shuffle: true } );
    });

    afterAll( () => {
        accordion.destroy();
    });

    test( 'should have random panel order when `shuffle` is used', () => {
        const notExpectedPanelOrder = ['1', '2', '3', '4', '5'];
        const randomPanelOrder = [];

        for ( let i = 0; i < accordion.getTotalPanels(); i++ ) {
            randomPanelOrder.push( accordion.getPanelAt( i ).panelEl.textContent );
        }

        expect( randomPanelOrder ).not.toEqual( notExpectedPanelOrder );
    });

    test( 'should have the correct number of panels when `shuffle` is used', () => {
        expect( accordion.getTotalPanels() ).toBe( 5 );
    });

    test( 'should have unique panels when `shuffle` is used', () => {
        const panels = ['1', '2', '3', '4', '5'];

        for ( let i = 0; i < accordion.getTotalPanels(); i++ ) {
            const index = panels.indexOf( accordion.getPanelAt( i ).panelEl.textContent );
            panels.splice( index, 1 );
        }

        expect( panels.length ).toBe( 0 );
    });
});

describe( 'update the accordion content', () => {
    beforeAll( () => {
        document.body.innerHTML = basicAccordion;
        accordionEl = document.getElementsByClassName( 'grid-accordion' )[0];
        accordion = new GridAccordion( '.grid-accordion' );
    });

    afterAll( () => {
        accordion.destroy();
    });

    test( 'should add a panel at the correct position', () => {
        const newPanelEl = document.createElement( 'div' );
        newPanelEl.classList.add( 'ga-panel' );
        newPanelEl.textContent = 'new panel';

        accordionEl.getElementsByClassName( 'ga-panel' )[2].after( newPanelEl );

        accordion.update();

        const panelsContent = [];

        for ( let i = 0; i < accordion.getTotalPanels(); i++ ) {
            panelsContent.push( accordion.getPanelAt( i ).panelEl.textContent );
        }

        expect( panelsContent ).toEqual( ['1', '2', '3', 'new panel', '4', '5'] );
    });

    test( 'should add multiple panels at the correct position', () => {
        const secondPanelEl = document.createElement( 'div' );
        secondPanelEl.classList.add( 'ga-panel' );
        secondPanelEl.textContent = 'second panel';

        const thirdPanelEl = document.createElement( 'div' );
        thirdPanelEl.classList.add( 'ga-panel' );
        thirdPanelEl.textContent = 'third panel';

        accordionEl.getElementsByClassName( 'ga-panel' )[1].after( secondPanelEl );
        accordionEl.getElementsByClassName( 'ga-panel' )[5].after( thirdPanelEl );

        accordion.update();

        const panelsContent = [];

        for ( let i = 0; i < accordion.getTotalPanels(); i++ ) {
            panelsContent.push( accordion.getPanelAt( i ).panelEl.textContent );
        }

        expect( panelsContent ).toEqual( ['1', '2', 'second panel', '3', 'new panel', '4', 'third panel', '5'] );
    });

    test( 'should remove a panel', () => {
        const toRemovePanelEl = accordionEl.getElementsByClassName( 'ga-panel' )[4];
        toRemovePanelEl.remove();

        accordion.update();

        const panelsContent = [];

        for ( let i = 0; i < accordion.getTotalPanels(); i++ ) {
            panelsContent.push( accordion.getPanelAt( i ).panelEl.textContent );
        }

        expect( panelsContent ).toEqual( ['1', '2', 'second panel', '3', '4', 'third panel', '5'] );
    });

    test( 'should remove multiple panels', () => {
        let toRemovePanelEl = accordionEl.getElementsByClassName( 'ga-panel' )[4];
        toRemovePanelEl.remove();

        toRemovePanelEl = accordionEl.getElementsByClassName( 'ga-panel' )[2];
        toRemovePanelEl.remove();

        toRemovePanelEl = accordionEl.getElementsByClassName( 'ga-panel' )[4];
        toRemovePanelEl.remove();

        accordion.update();

        const panelsContent = [];

        for ( let i = 0; i < accordion.getTotalPanels(); i++ ) {
            panelsContent.push( accordion.getPanelAt( i ).panelEl.textContent );
        }

        expect( panelsContent ).toEqual( ['1', '2', '3', 'third panel'] );
    });

    test( 'should add and remove multiple panels', () => {
        let newPanelEl = document.createElement( 'div' );
        newPanelEl.classList.add( 'ga-panel' );
        newPanelEl.textContent = '4';
        accordionEl.getElementsByClassName( 'ga-panel' )[2].after( newPanelEl );

        newPanelEl = document.createElement( 'div' );
        newPanelEl.classList.add( 'ga-panel' );
        newPanelEl.textContent = '5';
        accordionEl.getElementsByClassName( 'ga-panel' )[3].after( newPanelEl );

        let toRemovePanelEl = accordionEl.getElementsByClassName( 'ga-panel' )[5];
        toRemovePanelEl.remove();

        toRemovePanelEl = accordionEl.getElementsByClassName( 'ga-panel' )[0];
        toRemovePanelEl.remove();

        accordion.update();

        const panelsContent = [];

        for ( let i = 0; i < accordion.getTotalPanels(); i++ ) {
            panelsContent.push( accordion.getPanelAt( i ).panelEl.textContent );
        }

        expect( panelsContent ).toEqual( ['2', '3', '4', '5'] );
    });
});