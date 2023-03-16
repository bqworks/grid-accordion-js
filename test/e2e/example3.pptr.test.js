describe( 'example 4', () => {
    beforeAll( async () => {
        await page.setViewport( { width: 1200, height: 900 } );
        await page.goto( global.E2E_BASE_URL + 'example3.html' );
        await page.addStyleTag( { content: 'body { margin: 0 }' } );
    });

    test( 'should navigate through the panels using the arrow key ', async () => {
        const totalPanels = await page.$eval( '.grid-accordion', accordionEl => accordionEl.getElementsByClassName( 'ga-panel' ).length );

        for ( let i = 0; i < totalPanels; i++ ) {
            await page.keyboard.press( 'ArrowRight' );
            await page.waitForTimeout( 1000 );

            let isPanelOpened = await page.$eval( `.grid-accordion .ga-panel:nth-child(${ i + 1 })`, panelEl => panelEl.classList.contains( 'ga-opened' ) );
            expect( isPanelOpened ).toBe( true );
        }
    });

    test( 'should navigate backwards using the links', async () => {
        const totalPanels = await page.$eval( '.grid-accordion', accordionEl => accordionEl.getElementsByClassName( 'ga-panel' ).length );

        for ( let i = totalPanels - 1; i >= 0; i-- ) {
            await page.click( `.controls a[href$="${ i }"]` );
            await page.waitForTimeout( 1000 );

            let isPanelOpened = await page.$eval( `.grid-accordion .ga-panel:nth-child(${ i + 1 })`, panelEl => panelEl.classList.contains( 'ga-opened' ) );
            expect( isPanelOpened ).toBe( true );

            let hash = await page.evaluate( () => window.location.hash );
            expect( hash ).toBe( `#example3/${ i }` );
        }
    });

    test( 'should close the panels', async () => {
        await page.click( '.controls a[href="#"]' );
        await page.waitForTimeout( 1000 );

        const isClosed = await page.$eval( '.grid-accordion', accordionEl => accordionEl.classList.contains( 'ga-closed' ) );

        expect( isClosed ).toBe( true );
    });
});