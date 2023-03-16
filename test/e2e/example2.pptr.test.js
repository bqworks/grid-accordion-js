describe( 'example 2', () => {
    beforeAll( async () => {
        await page.setViewport( { width: 800, height: 500, deviceScaleFactor: 2 } );
        await page.goto( global.E2E_BASE_URL + 'example2.html' );
        await page.addStyleTag( { content: 'body { margin: 0 }' } );
    });

    test( 'should have the size of the accordion set to the size of the viewport', async () => {
        await page.setViewport( { width: 800, height: 400, deviceScaleFactor: 2 } );
        await page.waitForTimeout( 500 );

        let accordionWidth = await page.$eval( '.grid-accordion', accordionEl => accordionEl.clientWidth );

        expect( accordionWidth ).toBe( 800 );
    });

    test( 'should navigate through all the slides upon keyboard arrow press', async () => {
        const totalPanels = await page.$eval( '.grid-accordion', accordionEl => accordionEl.getElementsByClassName( 'ga-panel' ).length );

        for ( let i = 0; i < totalPanels; i++ ) {
            await page.keyboard.press( 'ArrowRight' );
            await page.waitForTimeout( 1000 );
        }

        const isLastPanelOpened = await page.$eval( `.ga-panel:nth-child(${ totalPanels })`, panelEl => panelEl.classList.contains( 'ga-opened' ) );

        expect( isLastPanelOpened ).toBe( true );
    });

    test( 'should load the large version of the images', async () => {
        const imagesSources = await page.$$eval( '.ga-panel img', imagesEl => imagesEl.map( imageEl => imageEl.src ) );

        imagesSources.forEach( ( imageSource ) => {
            expect( imageSource.indexOf( '@2x' ) ).not.toBe( -1 );
        });
    });

    test( 'should navigate backwards using arrow key and fade in the additional background image', async () => {
        const totalPanels = await page.$eval( '.grid-accordion', accordionEl => accordionEl.getElementsByClassName( 'ga-panel' ).length );

        for ( let i = totalPanels - 1; i >= 0; i-- ) {
            let openedPanelBackgroundVisibility = await page.$eval( `.grid-accordion .ga-panel:nth-child(${ i + 1 }) .ga-background-opened`, imageEl => imageEl.style.visibility );
            expect( openedPanelBackgroundVisibility ).toBe( 'visible' );

            await page.keyboard.press( 'ArrowLeft' );
            await page.waitForTimeout( 1000 );
        }
    });
});