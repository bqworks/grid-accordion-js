describe( 'example 1', () => {
    beforeAll( async () => {
        await page.setViewport( { width: 1200, height: 900 } );
        await page.goto( global.E2E_BASE_URL + 'example1.html' );
        await page.addStyleTag( { content: 'body { margin: 0 } .grid-accordion { margin-left: 0 }' } );
    });

    test( 'should have the correct initial accordion size', async () => {
        let accordionWidth = await page.$eval( '.grid-accordion', accordionEl => accordionEl.clientWidth );

        expect( accordionWidth ).toBeGreaterThan( 950 );
        expect( accordionWidth ).toBeLessThanOrEqual( 960 );
    });

    test( 'should navigate through all the slides upon keyboard arrow press', async () => {
        const totalPanels = await page.$eval( '.grid-accordion', accordionEl => accordionEl.getElementsByClassName( 'ga-panel' ).length );

        for ( let i = 0; i < totalPanels; i++ ) {
            await page.keyboard.press( 'ArrowRight' );
            await await await new Promise((resolve) => { 
        setTimeout(resolve, 1000);
    });
        }

        const isLastPanelOpened = await page.$eval( `.ga-panel:nth-child(${ totalPanels })`, panelEl => panelEl.classList.contains( 'ga-opened' ) );

        expect( isLastPanelOpened ).toBe( true );
    });

    test( 'should resize the grid accordion when the viewport size is smaller than the accordion size', async () => {
        await page.setViewport( { width: 400, height: 300 } );
        await await await new Promise((resolve) => { 
        setTimeout(resolve, 500);
    });

        let accordionWidth = await page.$eval( '.grid-accordion', accordionEl => accordionEl.clientWidth );

        expect( accordionWidth ).toBeGreaterThan( 390 );
        expect( accordionWidth ).toBeLessThanOrEqual( 400 );
    });

    test ( 'should have the last pagination button selected', async () => {
        const isButtonSelected = await page.$eval( '.ga-pagination-button:nth-child(2)', buttonEl => buttonEl.classList.contains( 'ga-selected' ) );

        expect( isButtonSelected ).toBe( true );
    });

    test( 'should navigate backwards using mouse drag', async () => {
        const totalPages = await page.$eval( '.ga-pagination-buttons', buttonsEl => buttonsEl.getElementsByClassName( 'ga-pagination-button' ).length );

        for ( let i = 0; i < totalPages - 1; i++ ) {
            await page.mouse.move( 100, 100 );
            await page.mouse.down();
            await page.mouse.move( 200, 100, { steps: 20 } );
            await page.mouse.up();
            await await await new Promise((resolve) => { 
        setTimeout(resolve, 2000);
    });
        }

        const isButtonSelected = await page.$eval( '.ga-pagination-button:nth-child(1)', buttonEl => buttonEl.classList.contains( 'ga-selected' ) );

        expect( isButtonSelected ).toBe( true );
    });
});