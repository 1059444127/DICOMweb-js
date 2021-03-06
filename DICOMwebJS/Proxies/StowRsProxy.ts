﻿class StowRsProxy {
   public _baseUrl: string = "";

   constructor(baseUrl: string = null) {
      this._baseUrl = baseUrl;
   }

   public get BaseUrl() {
      if (this._baseUrl === null) {
         return DICOMwebJS.ServerConfiguration.getStowUrl();
      }
      else {
         return this._baseUrl;
      }
   }

   public set BaseUrl(value: string) {
      this._baseUrl = value;
   }

   private _returnJson: boolean = true;
   public get returnJson ( ) : boolean { return this._returnJson ; }
   public set returnJson( value : boolean ) { this._returnJson = value ; }

   StoreInstance
   (
      fileBuffer: ArrayBuffer,
      studyInstanceUID: string,
      query:string
   ) : JQueryPromise<XMLHttpRequest>
   {
      var deffered = $.Deferred();
      var studyPart = (studyInstanceUID) ? "/studies/" + studyInstanceUID : "";
      var url = this.BaseUrl + studyPart + "?"+ (query||"");
      var xhr = new XMLHttpRequest();
      var boundary = 'DICOM FILE';
      var method = 'POST';
      var acceptHeader = "application/json, application/dicom+xml; q=0.9, */*; q = 0.1"; //this will let the server favor json
      var url = url;
      var request = this.gen_multipart(" ",boundary, MimeTypes.DICOM, fileBuffer);
      var xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader("Content-Type", MimeTypes.getMultiPartAcceptHeader ( MimeTypes.DICOM ) +  '; boundary="' + boundary + '"' );
      xhr.setRequestHeader("accept", acceptHeader); //server also supports XML

      if (DICOMwebJS.ServerConfiguration.IncludeAuthorizationHeader)
      {
         xhr.setRequestHeader("Authorization", DICOMwebJS.ServerConfiguration.SecurityToken );
      }

      xhr.onreadystatechange = function (data) {
         if (xhr.readyState == 4) {
            if (xhr.status == 200 || xhr.status == 304) {
               deffered.resolve(xhr);
            }
            else {
               deffered.reject( xhr);
            }
         }
      };
      xhr.onerror = function (error) {
         deffered.reject(xhr);
      };

      xhr.send(request);

      return deffered.promise();
   }

   //
   //http://stackoverflow.com/questions/8262266/xmlhttprequest-multipart-related-post-with-xml-and-image-as-payload
   //
   private gen_multipart(title:string, boundary: string, mimetype: string, byteBuffer: ArrayBuffer) {
      var buffer: Uint8Array = new Uint8Array(byteBuffer); // Wrap in view to get data

      var before = [title, "\r\n--", boundary, "\r\n", 'Content-Type:', mimetype, "\r\n\r\n"].join('');
      var after = "\r\n--" + boundary + "--" ;
      var size = before.length + buffer.byteLength + after.length;
      var uint8array = new Uint8Array(size);
      var i = 0;

      // Append the string.
      for (; i < before.length; i++) {
         uint8array[i] = before.charCodeAt(i) & 0xff;
      }

      // Append the binary data.
      for (var j = 0; j < buffer.byteLength; i++ , j++) {
         uint8array[i] = buffer[j];
      }

      // Append the remaining string
      for (var j = 0; j < after.length; i++ , j++) {
         uint8array[i] = after.charCodeAt(j) & 0xff;
      }
      return uint8array; // <-- This is an ArrayBuffer object!
   }
}