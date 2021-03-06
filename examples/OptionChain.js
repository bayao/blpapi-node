var c = require('./Console.js');
var blpapi = require('blpapi');

var hp = c.getHostPort();
// Add 'authenticationOptions' key to session options if necessary.
var session = new blpapi.Session({ serverHost: hp.serverHost,
                                   serverPort: hp.serverPort });
var service_refdata = 1; // Unique identifier for refdata service

var seclist = ['AAPL US Equity'];

session.on('SessionStarted', function(m) {
    //c.log(m);
    session.openService('//blp/refdata', service_refdata);
});

session.on('ServiceOpened', function(m) {
    //c.log(m);
    // Check to ensure the opened service is the refdata service
    if (m.correlations[0].value == service_refdata) {
        // Request the long-form company name and option chain
        session.request('//blp/refdata', 'ReferenceDataRequest',
            { securities: seclist,
              fields: ['LONG_COMP_NAME', 'CHAIN_FULL']
            }, 100);
    }
});

var options = [];

session.on('ReferenceDataResponse', function(m) {
    //c.log(m);
    // At this point, m.correlations[0].value will equal:
    // 100 -> ReferenceDataResponse for option chain
    // 101 -> ReferenceDataResponse for LAST_PRICE of individual options
    if (m.correlations[0].value === 100) {
        var chain = m.data.securityData[0].fieldData.CHAIN_FULL;
        for (i in chain) {
            var strike = chain[i];
            var call = strike['Call Ticker'] + " Equity";
            var put = strike['Put Ticker'] + " Equity";
            options.push(call, put);
        }
        if (m.eventType === 'RESPONSE') {
            session.request('//blp/refdata', 'ReferenceDataRequest',
                { securities: options, fields: ['LAST_PRICE'] }, 101);
        }
    } else if (m.correlations[0].value === 101) {
        for (i in m.data.securityData) {
            var data = m.data.securityData[i];
            console.log(data.security, '=>', data.fieldData.LAST_PRICE);
        }
        if (m.eventType === 'RESPONSE') {
            session.stop();
        }
    }
});

session.on('SessionTerminated', function(m) {
    session.destroy();
});

session.start();

// Local variables:
// c-basic-offset: 4
// tab-width: 4
// indent-tabs-mode: nil
// End:
//
// vi: set shiftwidth=4 tabstop=4 expandtab:
// :indentSize=4:tabSize=4:noTabs=true:

// ----------------------------------------------------------------------------
// Copyright (C) 2014 Bloomberg L.P.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
// ----------------------------- END-OF-FILE ----------------------------------
