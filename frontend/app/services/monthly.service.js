import suppliesOnHelper from "../supplieson.helper";

export default class MonthlyService {
    constructor(AppConstants, JwtService, RetryRequest) {
        this._AppConstants = AppConstants;
        this._JwtService = JwtService;
        this.retryRequest = RetryRequest;
        this.headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this._JwtService.get()}`
        };
    }
    exportInvoiceFile(query) {
        const request = {};
        request.url = `${this._AppConstants.api}/monthlyinvoices?export=pdf&startDate=${query.startDate}&endDate=${query.endDate}&skip=${query.skip}&limit=${query.limit}`;
        if (query.supplierId) {
            if (query.supplierId !== 'All') {
                request.url = request.url.concat(`&supplierId=${query.supplierId}`);
            }
        }
        if (query.customerId) {
            if (query.customerId === 'All') {
                request.url = request.url.concat(`&customerId=All`);
            }else{
                request.url = request.url.concat(`&customerId=${query.customerId}`);
            }
        }else{
            request.url = request.url.concat(`&customerId=All`);
        }
        if (query.branchId) {
            if (query.branchId === 'All') {
                request.url = request.url.concat(`&branchId=All`);
            }else{
                request.url = request.url.concat(`&branchId=${query.branchId}`);
            }
        }else{
            request.url = request.url.concat(`&branchId=All`);
        }
        // request.url = request.url.concat(`&type=${query.type}`);
        request.method = 'GET';
        request.headers = { 'Content-Type': 'application/json' };
        request.responseType = 'arraybuffer';
        request.headers.Authorization = `Bearer ${this._JwtService.get()}`;

        this.retryRequest(request).then(
            (result) => {
                suppliesOnHelper.createBlob(result, 'SupOn-Report', 'pdf');
            }
        );
    }
    exportInvoiceDetailsFile(query) {
        const request = {};
        request.url = `${this._AppConstants.api}/monthlyinvoices/getInvoice?id=${query.id}&export=pdf`;
        // request.url = request.url.concat(`&type=${query.type}`);
        request.method = 'GET';
        request.headers = { 'Content-Type': 'application/json' };
        request.headers.Authorization = `Bearer ${this._JwtService.get()}`;
        request.responseType = 'arraybuffer';

        this.retryRequest(request).then(
            (result) => {
                suppliesOnHelper.createBlob(result, 'SupOn-Report', 'pdf');
            }
        );
    }
    createMonthlyInvoice(param){
        const request = {};
        request.url = `${this._AppConstants.api}/monthlyinvoices/create?customerId=${param.customerId}&startDate=${param.startDate}&endDate=${param.endDate}`;
        request.method = 'GET';
        request.headers = { 'Content-Type': 'application/json' };
        request.headers.Authorization = `Bearer ${this._JwtService.get()}`;
        this.retryRequest(request).then(
            // (result) => {
            //     let url =  `${this._AppConstants.api}/invoices/getInvoice?id=${result.data.data._id}&export=pdf`;
            //     const request2 = {
            //         url,
            //         headers: this._request.headers,
            //         responseType: 'arraybuffer',
            //         method: 'GET',
            //     };
            //     this.retryRequest(request2).then(
            //         (result1) => {
            //             suppliesOnHelper.createBlob(result1, 'SupOn-Report', 'pdf');
            //         }
            //     );
            // }
        );
    }
    listInvoices(query) {
        const request = {};
        request.url = `${this._AppConstants.api}/monthlyinvoices?startDate=${query.startDate}&endDate=${query.endDate}&skip=${query.skip}&limit=${query.limit}`;
        if (query.supplierId) {
            if (query.supplierId !== 'All') {
                request.url = request.url.concat(`&supplierId=${query.supplierId}`);
            }
        }
        if (query.customerId) {
            if (query.customerId === 'All') {
                request.url = request.url.concat(`&customerId=All`);
            }else{
                request.url = request.url.concat(`&customerId=${query.customerId}`);
            }
        }else{
            request.url = request.url.concat(`&customerId=All`);
        }
        if (query.branchId) {
            if (query.branchId === 'All') {
                request.url = request.url.concat(`&branchId=All`);
            }else{
                request.url = request.url.concat(`&branchId=${query.branchId}`);
            }
        }else{
            request.url = request.url.concat(`&branchId=All`);
        }
        // request.url = request.url.concat(`&type=${query.type}`);
        request.method = 'GET';
        request.headers = { 'Content-Type': 'application/json' };
        request.headers.Authorization = `Bearer ${this._JwtService.get()}`;

        return this.retryRequest(request);        
    }
    getInvoice(query) {
        const request = {};
        request.url = `${this._AppConstants.api}/monthlyinvoices/getInvoice?id=${query.id}`;
        // request.url = request.url.concat(`&type=${query.type}`);
        request.method = 'GET';
        request.headers = { 'Content-Type': 'application/json' };
        request.headers.Authorization = `Bearer ${this._JwtService.get()}`;

        return this.retryRequest(request);
    }
}

MonthlyService.$inject = ['AppConstants', 'JwtService', 'RetryRequest','$translate'];
