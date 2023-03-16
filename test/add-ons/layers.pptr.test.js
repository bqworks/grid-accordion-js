describe( 'layers add-on', () => {
    beforeAll( async () => {
        await page.goto( global.BASE_URL + 'layers.html');
        await page.setViewport( { width: 1024, height: 768 } );
    });

    test( 'should have the layers visible for the initial slide', async () => {
        await page.waitForTimeout( 500 );

        const layersVisibility = await page.$$eval( '.ga-panel.ga-opened .ga-layer', layersEl => layersEl.map( layerEl => layerEl.style.visibility !== undefined && layerEl.style.visibility !== 'hidden' ? true : false ) );

        expect( layersVisibility ).not.toContain( false );
    });

    test( 'should not have the layers visible for a panel that is not selected', async () => {
        const layersVisibility = await page.$$eval( '.ga-panel:nth-child(2) .ga-layer', ( layersEl ) => {
            return layersEl.map( ( layerEl ) => {
                return layerEl.style.visibility !== undefined && layerEl.style.visibility !== 'hidden' ? true : false;
            });
        });

        expect( layersVisibility ).not.toContain( true );
    });

    test( 'should not have the static layers set to be invisible', async () => {
        const layersVisibility = await page.$$eval( '.ga-layer:not(.ga-opened)', layersEl => layersEl.map( layerEl => layerEl.style.visibility !== undefined && layerEl.style.visibility !== 'hidden' ? true : false ) );

        expect( layersVisibility ).not.toContain( false );
    });

    test( 'should hide the visible layers when opening a new panel and show the new panel\'s layers', async () => {
        let layersVisibility = await page.$$eval( '.ga-panel:nth-child(1) .ga-layer', layersEl => layersEl.map( layerEl => layerEl.style.visibility !== undefined && layerEl.style.visibility !== 'hidden' ? true : false ) );

        expect( layersVisibility ).not.toContain( false );

        await page.keyboard.press( 'ArrowRight' );
        await page.waitForTimeout( 1000 );

        layersVisibility = await page.$$eval( '.ga-panel:nth-child(1) .ga-layer', layersEl => layersEl.map( layerEl => layerEl.style.visibility !== undefined && layerEl.style.visibility !== 'hidden' ? true : false ) );

        expect( layersVisibility ).not.toContain( true );

        layersVisibility = await page.$$eval( '.ga-panel:nth-child(2) .ga-layer', layersEl => layersEl.map( layerEl => layerEl.style.visibility !== undefined && layerEl.style.visibility !== 'hidden' ? true : false ) );

        expect( layersVisibility ).not.toContain( false );
    });

    test( 'should set the position of the layers correctly', async () => {
        const layersPosition = await page.$$eval( '.ga-panel.ga-opened .ga-layer', ( layersEl ) => {
            return layersEl.map( ( layerEl ) => {
                return { x: parseInt( layerEl.style.left ), y: parseInt( layerEl.style.top ) };
            });
        });

        expect( layersPosition[ 0 ] ).toEqual( { x: 100, y: 100 } );
        expect( layersPosition[ 1 ] ).toEqual( { x: 200, y: 200 } );
        expect( layersPosition[ 2 ] ).toEqual( { x: 300, y: 300 } );
        expect( layersPosition[ 3 ] ).toEqual( { x: 400, y: 400 } );
    });
});