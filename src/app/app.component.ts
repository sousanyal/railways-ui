import { Component, Renderer2 } from '@angular/core';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';
import { DomSanitizer } from '@angular/platform-browser';
import { saveAs as importedSaveAs } from "file-saver";

class ItemDetails {
  DataId: number;
  DiagramId: number;
  TypeId: number;
  Regions: string;
  RegionType: string;
  Zindex: number;
  Coordinates: number[]; // Add the 'coordinates' property
  ColorCode: string;
  UnitLength: number;
  Path: Path2D;
  State: boolean;
  constructor(dataId: number,
    diagramId: number,
    typeId: number,
    regions: string,
    regionType: string,
    zIndex: number,
    colorcode: string,
    unitLength: number,
    state: boolean) {
    this.DataId = dataId;
    this.DiagramId = diagramId;
    this.TypeId = typeId;
    this.Regions = regions;
    this.RegionType = regionType;
    this.Zindex = zIndex;
    this.ColorCode = colorcode;
    this.UnitLength = unitLength;
    this.State = state;

    this.Coordinates = regions.split(',').map(Number) as number[];
    const path = new Path2D();
    path.rect(this.Coordinates[0], this.Coordinates[1], this.Coordinates[2], this.Coordinates[3]);
    this.Path = path;
  }
}

const itemDetails: ItemDetails[] = [];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'coach-config';

  constructor(private renderer2: Renderer2, private domSanitizer: DomSanitizer) { }

  headerJson = "";
  detailJson: string[] = [];

  ngAfterViewInit(): void {
    console.log("ngAfterViewInit");
    this.loadDiagramDetails();
    window.addEventListener("load", this.draw);
    this.renderer2.listen("document", "click", event => this.printMousePos(event));
    this.renderer2.listen("document", "mousemove", event => this.mouseMove(event));
  }

  loadDiagramDetails() {
    console.log("loadDiagramDetails");
    const canvas = document.getElementById("coachcanvas");
    const ctx = (canvas as HTMLCanvasElement)?.getContext("2d");

    let j = itemDetails.length;
    for (let k = 0; k < this.detailJson.length; k++) {
      const detailResult = JSON.parse(this.detailJson[k]);
      for (let i = 0; i < detailResult.length; i++) {
        if (detailResult[i].RegionType == "R") {
          if (ctx) {
            ctx.fillStyle = detailResult[i].ColorCode;
          }
          itemDetails[j] = new ItemDetails(detailResult[i].DataId,
            detailResult[i].DiagramId,
            detailResult[i].TypeId,
            detailResult[i].Regions,
            detailResult[i].RegionType,
            detailResult[i].Zindex,
            detailResult[i].ColorCode,
            detailResult[i].UnitLength,
            detailResult[i].State);
          j++;
        }
      }
    }

    console.log(itemDetails);
  }

  draw() {
    console.log("draw");

    const canvas = document.getElementById("coachcanvas");
    if (canvas) {
      (canvas as HTMLCanvasElement).width = window.innerWidth;
      (canvas as HTMLCanvasElement).height = window.innerHeight;
    }

    if (this.headerJson !== "" && (canvas as HTMLCanvasElement).getContext) {
      const headerResult = JSON.parse(this.headerJson);
      const ctx = (canvas as HTMLCanvasElement)?.getContext("2d");
      let yOffset = 0;
      for (let i = 0; i < headerResult.length; i++) {
        const lineDimStr = headerResult[i].Lines.split('|');
        for (let j = 0; j < lineDimStr.length; j++) {
          const lineDim = lineDimStr[j].split(',').map(Number) as number[];
          ctx?.beginPath();
          console.log(lineDim[1] + yOffset);
          ctx?.moveTo(lineDim[0], lineDim[1] + yOffset);
          ctx?.lineTo(lineDim[2], lineDim[3] + yOffset);
          ctx?.stroke();
        }

        const rectangleDimStr = headerResult[i].Rectangles.split('|');
        for (let j = 0; j < rectangleDimStr.length; j++) {
          const rectDim = rectangleDimStr[j].split(',').map(Number) as number[];
          ctx?.strokeRect(rectDim[0], rectDim[1] + yOffset, rectDim[2], rectDim[3]);
        }

        const ellipseDimStr = headerResult[i].Eclipses.split('|');
        for (let j = 0; j < ellipseDimStr.length; j++) {
          const ellipseDim = ellipseDimStr[j].split(',').map(Number) as number[];
          ctx?.beginPath();
          ctx?.ellipse(ellipseDim[0], ellipseDim[1] + yOffset, ellipseDim[2], ellipseDim[3], Math.PI / 4, 0, 2 * Math.PI);
          ctx?.stroke();
        }

        yOffset += 300;
      }

      for (let i = 0; i < itemDetails.length; i++) {
        if (itemDetails[i].Zindex == 1 && itemDetails[i].State === true) {
          if (ctx) {
            ctx.fillStyle = itemDetails[i].ColorCode;
            ctx.fillRect(itemDetails[i].Coordinates[0], itemDetails[i].Coordinates[1],
              itemDetails[i].Coordinates[2], itemDetails[i].Coordinates[3]);
          }
        }

        if (itemDetails[i].Zindex == 0 && itemDetails[i].State === true) {
          if (ctx) {
            ctx.fillStyle = itemDetails[i].ColorCode;
            ctx?.fillRect(itemDetails[i].Coordinates[0], itemDetails[i].Coordinates[1] + 300,
              itemDetails[i].Coordinates[2], itemDetails[i].Coordinates[3]);
          }
        }

        if (itemDetails[i].Zindex == -1 && itemDetails[i].State === true) {
          if (ctx) {
            ctx.fillStyle = itemDetails[i].ColorCode;
            ctx?.fillRect(itemDetails[i].Coordinates[0], itemDetails[i].Coordinates[1] + 600,
              itemDetails[i].Coordinates[2], itemDetails[i].Coordinates[3]);
          }
        }
      }
    }
  }

  printMousePos(event: MouseEvent) {
    const canvas = document.getElementById("coachcanvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    const canvasBoundingLeft = canvas.getBoundingClientRect().left;
    const canvasBoundingTop = canvas.getBoundingClientRect().top;
    console.log("canvasBoundingLeft: " + canvasBoundingLeft + " - canvasBoundingTop: " + canvasBoundingTop);
    console.log("clientX: " + event.clientX + " - clientY: " + event.clientY);
    for (let i = 0; i < itemDetails.length; i++) {
      if (itemDetails[i].Zindex == 1
        && ctx?.isPointInPath(itemDetails[i].Path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop)
        && !ctx.isPointInStroke(itemDetails[i].Path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop)) {
        console.log("inside path " + itemDetails[i].Coordinates);
        if (itemDetails[i].State !== true) {
          ctx.fillStyle = itemDetails[i].ColorCode;
          ctx?.fillRect(itemDetails[i].Coordinates[0], itemDetails[i].Coordinates[1],
            itemDetails[i].Coordinates[2], itemDetails[i].Coordinates[3]);
          itemDetails[i].State = true;
          break;
        } else {
          ctx?.clearRect(itemDetails[i].Coordinates[0], itemDetails[i].Coordinates[1],
            itemDetails[i].Coordinates[2], itemDetails[i].Coordinates[3]);
          itemDetails[i].State = false;
          this.draw();
        }
      }

      if (itemDetails[i].Zindex == 0
        && ctx?.isPointInPath(itemDetails[i].Path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop - 300)
        && !ctx?.isPointInStroke(itemDetails[i].Path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop - 300)) {
        console.log("inside path " + itemDetails[i].Coordinates);
        if (itemDetails[i].State !== true) {
          ctx.fillStyle = itemDetails[i].ColorCode;
          ctx?.fillRect(itemDetails[i].Coordinates[0], itemDetails[i].Coordinates[1] + 300,
            itemDetails[i].Coordinates[2], itemDetails[i].Coordinates[3]);
          itemDetails[i].State = true;
          break;
        } else {
          ctx?.clearRect(itemDetails[i].Coordinates[0], itemDetails[i].Coordinates[1] + 300,
            itemDetails[i].Coordinates[2], itemDetails[i].Coordinates[3]);
          itemDetails[i].State = false;
          this.draw();
        }
      }

      if (itemDetails[i].Zindex == -1
        && ctx?.isPointInPath(itemDetails[i].Path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop - 600)
        && !ctx?.isPointInStroke(itemDetails[i].Path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop - 600)) {
        console.log("inside path " + itemDetails[i].Coordinates);
        if (itemDetails[i].State !== true) {
          ctx.fillStyle = itemDetails[i].ColorCode;
          ctx?.fillRect(itemDetails[i].Coordinates[0], itemDetails[i].Coordinates[1] + 600,
            itemDetails[i].Coordinates[2], itemDetails[i].Coordinates[3]);
          itemDetails[i].State = true;
          break;
        } else {
          ctx?.clearRect(itemDetails[i].Coordinates[0], itemDetails[i].Coordinates[1] + 600,
            itemDetails[i].Coordinates[2], itemDetails[i].Coordinates[3]);
          itemDetails[i].State = false;
          this.draw();
        }
      }
    }
  }

  mouseMove(event: MouseEvent) {
    const canvas = document.getElementById("coachcanvas") as HTMLCanvasElement;
    const ctx = canvas?.getContext("2d");
    const canvasBoundingLeft = canvas.getBoundingClientRect().left;
    const canvasBoundingTop = canvas.getBoundingClientRect().top;
    console.log("clientX: " + event.clientX + " - clientY: " + event.clientY);
    this.draw();
    for (let i = 0; i < itemDetails.length; i++) {
      if (itemDetails[i].Zindex == 1
        && ctx?.isPointInPath(itemDetails[i].Path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop)
        && !ctx.isPointInStroke(itemDetails[i].Path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop)) {
        if (itemDetails[i].State != true) {
          ctx.fillStyle = itemDetails[i].ColorCode;
          ctx.fillRect(itemDetails[i].Coordinates[0], itemDetails[i].Coordinates[1],
            itemDetails[i].Coordinates[2], itemDetails[i].Coordinates[3]);
        }
        break;
      }

      if (itemDetails[i].Zindex == 0
        && ctx?.isPointInPath(itemDetails[i].Path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop - 300)
        && !ctx.isPointInStroke(itemDetails[i].Path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop - 300)) {
        if (itemDetails[i].State != true) {
          ctx.fillStyle = itemDetails[i].ColorCode;
          ctx.fillRect(itemDetails[i].Coordinates[0], itemDetails[i].Coordinates[1] + 300,
            itemDetails[i].Coordinates[2], itemDetails[i].Coordinates[3]);
        }
        break;
      }

      if (itemDetails[i].Zindex == -1
        && ctx?.isPointInPath(itemDetails[i].Path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop - 600)
        && !ctx.isPointInStroke(itemDetails[i].Path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop - 600)) {
        if (itemDetails[i].State != true) {
          ctx.fillStyle = itemDetails[i].ColorCode;
          ctx.fillRect(itemDetails[i].Coordinates[0], itemDetails[i].Coordinates[1] + 600,
            itemDetails[i].Coordinates[2], itemDetails[i].Coordinates[3]);
        }
        break;
      }
    }
  }

  public onChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement?.files && inputElement.files.length > 0) {
      console.log(inputElement.files);
      let detailJsonIndex = 0;
      for (const file of Array.from(inputElement.files)) {
        if (file.name.includes("header")) {
          const fileReader: FileReader = new FileReader();
          fileReader.onloadend = (x) => {
            console.log("header file found - " + file.name);
            this.headerJson = fileReader.result as string;
            this.draw();
          }
          fileReader.readAsText(file);
        } else if (file.name.includes("Detail")) {
          const fileReader: FileReader = new FileReader();
          fileReader.onloadend = (x) => {
            console.log("detail file found - " + file.name);
            this.detailJson[detailJsonIndex++] = fileReader.result as string;
            this.loadDiagramDetails();
            this.draw();
          }
          fileReader.readAsText(file);
        }
      }
    }
  }

  public saveCanvasPDF() {
    const data = document.getElementById('coachcanvas');
    if (data) {
      html2canvas(data).then(canvas => {
        const imgWidth = 208;
        const imgHeight = canvas.height * imgWidth / canvas.width;

        const contentDataURL = canvas.toDataURL('image/png')
        const pdf = new jspdf('p', 'mm', 'a4'); // A4 size page of PDF
        const position = 0;
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight)
        pdf.save('coach-config.pdf'); // Generated PDF
      });
      this.saveSelectedItemsJson();
    }
  }

  private saveSelectedItemsJson() {
    console.log("savePoints");
    console.log(itemDetails);
    //const jsonData = JSON.stringify(itemDetails.filter(x => x.state === true));
    const jsonData = JSON.stringify(itemDetails);
    const blob = new Blob([jsonData], {
      type: 'application/json'
    });
    importedSaveAs(blob, "coach-config-Details.json");
  }
}