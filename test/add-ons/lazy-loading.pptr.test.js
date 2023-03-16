describe( 'lazy-loading add-on', () => {
    beforeAll( async () => {
        await page.setViewport( { width: 1024, height: 768 } );
        await page.goto( global.BASE_URL + 'lazy-loading.html');
    });

    test( 'should have the images loaded only in the visible panels', async () => {
        const imagesSources = await page.$$eval( '.ga-background', imagesEl => imagesEl.map( imageEl => imageEl.getAttribute( 'src' ) ) );

        imagesSources.forEach( ( imageSource, index ) => {
            if ( index === 0 || index === 1 || index === 2 || index === 3 ) {
                expect( imageSource.indexOf( 'default' ) ).not.toBe( -1 );
            } else {
                expect( imageSource.indexOf( 'blank' ) ).not.toBe( -1 );
            }
        });
    });

    test( 'should load the images in the new panels after navigating to a new page', async () => {
        await page.click( '.ga-pagination-button:nth-child(2)' );

        await page.waitForTimeout( 100 );

        const imagesSources = await page.$$eval( '.ga-background', imagesEl => imagesEl.map( imageEl => imageEl.getAttribute( 'src' ) ) );

        imagesSources.forEach( ( imageSource, index ) => {
            if ( index === 4 || index === 5 || index === 6 || index === 7 ) {
                expect( imageSource.indexOf( 'default' ) ).not.toBe( -1 );
            }
        });
    });
});